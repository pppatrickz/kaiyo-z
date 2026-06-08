/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://kaiyo-z.com',
  generateRobotsTxt: true,
  exclude: [
    '/admin/*',      
    '/test/*',          // 排除整個資料夾
  ],
};
