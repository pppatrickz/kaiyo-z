// /functions/admin/_middleware.js
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

  const EXPECTED_TOKEN = "authenticated_p_do_lab";
  const url = new URL(request.url);
  
  // 🎯 修正點：使用正則表達式，更嚴格、更全面地防護 admin 的所有路徑
  const isLoginPath = url.pathname.replace(/\/$/, "") === "/admin/login";
  const isAdminApiPath = url.pathname.startsWith("/admin/api/");
  const isAdminArea = url.pathname.startsWith("/admin");

  // 如果在後台範圍內，且既不是登入頁也不是 API，而且 Token 不對，就強制導向
  if (
    isAdminArea &&
    !isLoginPath && 
    !isAdminApiPath &&
    authToken !== EXPECTED_TOKEN 
  ) {
    return Response.redirect(new URL("/admin/login", request.url), 302);
  }

  return await context.next();
}