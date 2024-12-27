export function list(posts) {
  return `
    <html>
      <body>
        <h1>Blog Posts</h1>
        <a href="/post/new">Create a New Post</a>
        <ul>
          ${posts.map(post => `
            <li>
              <a href="/post/${post.id}">${post.title}</a> 
              <small>(Created at: ${post.created_at.toLocaleString()})</small>
            </li>`).join('')}
        </ul>
      </body>
    </html>
  `;
}

export function newPost() {
  return `
    <html>
      <body>
        <h1>Create a New Post</h1>
        <form action="/post" method="post">
          <p><input type="text" name="title" placeholder="Title"></p>
          <p><textarea name="body" placeholder="Body"></textarea></p>
          <p><button type="submit">Create</button></p>
        </form>
      </body>
    </html>
  `;
}

export function show(post) {
  return `
    <html>
      <body>
        <h1>${post.title}</h1>
        <p>${post.body}</p>
        <small>Created at: ${post.created_at.toLocaleString()}</small>
        <p><a href="/">Back to posts</a></p>
      </body>
    </html>
  `;
}
