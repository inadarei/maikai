const Koa = require('koa');
const app = new Koa();

app.use(koaMiddleWare);

// response
app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(3535);

async function koaMiddleWare(ctx, next) {
  if (ctx.request.originalUrl != '/health') return next();
  console.dir(ctx.request);
}
