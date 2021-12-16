/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
  //flags: {
    //PRESERVE_WEBPACK_CACHE: true,
    //FAST_DEV: true
    ///DEV_SSR:true
  //},
  /* Your site config here */
  pathPrefix: `/Spa/OA`,
  plugins: [
    {
      resolve: "gatsby-plugin-no-sourcemaps",
    }
  ],
}
