module.exports = function(app) {
    app.use(
      createProxyMiddleware(["/api" , "/user"], { target: "http://localhost:8080" })
    );
  };