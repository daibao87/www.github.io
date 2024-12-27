import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as render from './render.js';
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";

const db = new DB("blog.db");
db.query(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    title TEXT,
    body TEXT
  )
`);
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    email TEXT
  )
`);

const router = new Router();

router
  .get('/', list) // List all posts
  .get('/signup', signupUi)
  .post('/signup', signup)
  .get('/login', loginUi)
  .post('/login', login)
  .get('/logout', logout)
  .get('/post/new', add)
  .get('/post/:id', show)
  .post('/post', create)
  .get('/list/:user', listUserPosts); // List posts by a specific user

const app = new Application();
app.use(Session.initMiddleware());
app.use(router.routes());
app.use(router.allowedMethods());

function sqlcmd(sql, params = []) {
  console.log('sql:', sql);
  try {
    const results = db.query(sql, params);
    console.log('sqlcmd: results=', results);
    return results;
  } catch (error) {
    console.log('sqlcmd error: ', error);
    throw error;
  }
}

function postQuery(sql, params = []) {
  const list = [];
  for (const [id, username, title, body] of sqlcmd(sql, params)) {
    list.push({ id, username, title, body });
  }
  console.log('postQuery: list=', list);
  return list;
}

async function parseFormBody(body) {
  const pairs = await body.form();
  const obj = {};
  for (const [key, value] of pairs) {
    obj[key] = value;
  }
  return obj;
}

async function signupUi(ctx) {
  ctx.response.body = await render.signupUi();
}

async function signup(ctx) {
  const body = ctx.request.body();
  if (body.type === "form") {
    const user = await parseFormBody(body);
    const dbUsers = postQuery(
      `SELECT id FROM users WHERE username = ?`,
      [user.username]
    );
    if (dbUsers.length === 0) {
      sqlcmd(
        "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
        [user.username, user.password, user.email]
      );
      ctx.response.body = render.success();
    } else {
      ctx.response.body = render.fail();
    }
  }
}

async function loginUi(ctx) {
  ctx.response.body = await render.loginUi();
}

async function login(ctx) {
  const body = ctx.request.body();
  if (body.type === "form") {
    const user = await parseFormBody(body);
    const dbUsers = postQuery(
      `SELECT username, password FROM users WHERE username = ?`,
      [user.username]
    );
    const dbUser = dbUsers[0];
    if (dbUser && dbUser.password === user.password) {
      ctx.state.session.set('user', { username: user.username });
      ctx.response.redirect('/');
    } else {
      ctx.response.body = render.fail();
    }
  }
}

async function logout(ctx) {
  ctx.state.session.set('user', null);
  ctx.response.redirect('/');
}

async function list(ctx) {
  const posts = postQuery("SELECT id, username, title, body FROM posts");
  ctx.response.body = await render.list(posts, await ctx.state.session.get('user'));
}

async function listUserPosts(ctx) {
  const user = ctx.params.user;
  const posts = postQuery("SELECT id, username, title, body FROM posts WHERE username = ?", [user]);
  ctx.response.body = await render.list(posts, await ctx.state.session.get('user'), user);
}

async function add(ctx) {
  const user = await ctx.state.session.get('user');
  if (user) {
    ctx.response.body = await render.newPost(user.username);
  } else {
    ctx.response.body = render.fail();
  }
}

async function show(ctx) {
  const pid = ctx.params.id;
  const posts = postQuery(`SELECT id, username, title, body FROM posts WHERE id = ?`, [pid]);
  const post = posts[0];
  if (!post) ctx.throw(404, 'Invalid post id.');
  ctx.response.body = await render.show(post);
}

async function create(ctx) {
  const body = ctx.request.body();
  if (body.type === "form") {
    const post = await parseFormBody(body);
    const user = await ctx.state.session.get('user');
    if (user) {
      sqlcmd("INSERT INTO posts (username, title, body) VALUES (?, ?, ?)", [user.username, post.title, post.body]);
      ctx.response.redirect('/');
    } else {
      ctx.throw(404, 'Not logged in.');
    }
  }
}

console.log('Server run at http://127.0.0.1:8000');
await app.listen({ port: 8000 });
