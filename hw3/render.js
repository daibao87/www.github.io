export function list(user, posts) {
  return `
    <html>
      <body>
        <h1>${user}'s Blog Posts</h1>
        <a href="/${user}/post/new">Create a New Post</a>
        <ul>
          ${posts.map(post => `
            <li>
              <a href="/${user}/post/${post.id}">${post.title}</a>
            </li>`).join('')}
        </ul>
      </body>
    </html>
  `;
}

export function newPost(user) {
  return `
    <html>
      <body>
        <h1>Create a New Post for ${user}</h1>
        <form action="/${user}/post" method="post">
          <p><input type="text" name="title" placeholder="Title"></p>
          <p><textarea name="body" placeholder="Body"></textarea></p>
          <p><button type="submit">Create</button></p>
        </form>
      </body>
    </html>
  `;
}

export function show(user, post) {
  return `
    <html>
      <body>
        <h1>${post.title}</h1>
        <p>${post.body}</p>
        <p><a href="/${user}/">Back to posts</a></p>
      </body>
    </html>
  `;
}
