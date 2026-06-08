export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();
    
    // 從 Cloudflare 邊緣環境變數讀取正確密碼
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD; 

    if (!ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "伺服器環境變數未設定 ADMIN_PASSWORD" }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password === ADMIN_PASSWORD) {
      // 驗證成功，簽發一個簡單的驗證 Cookie
      const cookieValue = "authenticated_p_do_lab";
      const maxAge = 60 * 60 * 24 * 7; // 有效期 7 天
      
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append(
        "Set-Cookie", 
        `p_do_session=${cookieValue}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict; Secure;`
      );

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(
      JSON.stringify({ error: "密碼錯誤，拒絕存取" }), 
      { status: 401, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "伺服器解析錯誤" }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}