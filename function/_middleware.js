//functions/admin/_middleware.js
export async function onRequest(context) {
  const { request, env } = context;
  
  // 取得瀏覽器的 Cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const parts = c.trim().split('=');
      return [parts[0], parts.slice(1).join('=')];
    })
  );
  const authToken = cookies["p_do_session"];

  // 預期正確的 Cookie 權權值
  const EXPECTED_TOKEN = "authenticated_p_do_lab";
  const url = new URL(request.url);
  
  // 如果 Cookie 不對，且不是在登入頁面或 API，就強制導向登入頁
  if (
    authToken !== EXPECTED_TOKEN && 
    url.pathname !== "/admin/login" && 
    !url.pathname.startsWith("/admin/api/")
  ) {
    return Response.redirect(new URL("/admin/login", request.url), 302);
  }

  return await context.next();
}