export default {
  /**
   * Uses axios and the VusJS router to use CAS for login and logout :
   * - Login: redirects to the CAS login URL with the ticket server for the service.
   * - Logout: empties the local storage and redirect to the CAS logout URL.
   * - URL protected: checks if the URL has the meta "casAuthentication". If it's the meta use the login method.
   *
   * Forked from: https://git.unistra.fr/vue/cas-authentication
   *
   * @param {Object} vue - Vue instance.
   * @param {VueRouter} router - VueJS Router instance; Init the router with the logout URL, cf. documentation.
   * @param {Object} axios - Axios instance; Init this instance and add this to vue initialization.
   * @param {function} axios.post
   * @param options {Object} - Object containing the additional options.
   * @param options.appIsAllAuth {Boolean} - Option to indicate if the app is fully protected.
   * @param options.authCasLogoutUrl {String} - Name URL for logout. Init this route in the router.
   * @param options.authServerUrl {String} - URL of CAS auth server
   * @param options.serverCAS {String} - URL of CAS server
   * @param options.tokenErrorRoutes {object} - error code as key, corresponding redirection url as value
   */
  install (vue, { router, axios, options }) {
    if (!router) throw new Error('You must install Vue-Router and pass an instance as a parameter of the CAS call.')
    if (!axios) throw new Error('You must install Axios and Vue-Axios and pass an instance as a parameter of the CAS call.')

    const authServerUrl = ('authServerUrl' in options ? options.authServerUrl
                                                    : '')
    const serverCAS = ('serverCAS' in options ? options.serverCAS : '')
    var URI = "";
    const tokenErrorRoutes = {
      ...('tokenErrorRoutes' in options) ? options.tokenErrorRoutes : {},
      default: 'vue_cas_token_error',
    }
    const publicRouteNames = Object.values(tokenErrorRoutes)

    if (router.getRoutes().every(route => route.name !== 'vue_cas_token_error')) {
      router.addRoute({
        path: '/token/_error',
        name: 'vue_cas_token_error',
        component: vue.component('VueCasTokenError', {
          render: function (createElement) {
            return createElement('div', 'no token retrieved, authentication failed')
          }
        })
      })
    }

    /**
     * Redirects the user to login URL on the CAS service.
     * For the service: JWT Server URI + "/redirect/" + Current page encoded in Base64
     */
    const login = () => {
            localStorage.clear();
            let service = `${authServerUrl}?service=${window.btoa(window.location.href)}`;
            localStorage.setItem('origin', window.location.href);
            window.location = `${serverCAS}/cas/login?service=${encodeURIComponent(window.location.href)}`;
    }

      /**
     * For logout, the plugin clears le local storage to delete the tokens.
     * Redirects the user to logout URL on the CAS service.
     */
    const logout = () => {
      localStorage.clear()
      window.location = `${serverCAS}/cas/logout`
      }

    /**
     * Checks if the token is expired.
     * Recovers the payload, decodes the payload with Base64 decode method.
     * Checks the exp field with the current timestamp.
     *
     * @param token {String}
     * @return {boolean}
     */
    const expired = token => {
      return JSON.parse(atob(token.split('.')[1])).exp < Math.trunc(Date.now() / 1000)
    }

    const getCredential = async () => {
            let url = new URL(window.location.href);
            let ticket = url.searchParams.get("ticket");
            axios.get(`${authServerUrl}?service=${localStorage.getItem('origin')}&ticket=${ticket}`)
            .then(response => {
                let parser = new DOMParser();
                let parseResponse = parser.parseFromString(response.data,"application/xml");
                const errorNode = parseResponse.querySelector("parsererror");
                let username ="";
                if (errorNode || parseResponse.documentElement.firstElementChild.localName == 'authenticationFailure') {
                    console.log(response.data)
                    console.log('auth failed');
                } else {
                    username = parseResponse.documentElement.firstElementChild.children[0].innerHTML
                }
                localStorage.setItem('username', username);
                return username;
            });
    }


    router.beforeEach(
      async (to, from, next) => {

        if (to.name === options.authCasLogoutUrl) {
          /**
           * If the name of the current route is equal to that passed in the Options object on the parameters,
           * the plugin call logout method.
           */
          logout()
        } else if (publicRouteNames.includes(to.name)) {
          /**
           * If route name is defined as an error route, plugin allow access.
           */
          next()
        } else if (options.appIsAllAuth || to.matched.some(record => record.meta.casAuthentication) === true ) {
          let urlParams = new URLSearchParams(window.location.search);
          /** Check if auth already done */
          if(urlParams.get('ticket') !== null) {
              localStorage.setItem('CAS__access__ticket', urlParams.get('ticket'));
              let username = await getCredential();
              if(localStorage.getItem('username') != "") {
                  localStorage.setItem('username', username);
                  next();
              }
          } else {
              /** Check if user already connected */
              let username = localStorage.getItem('username');
              if(username === 'undefined' || username === null || username === '') {
                  login();
              } else {
                  next()
              }
          }
        } else {
            /** Public page : no auh */
            next()
        }
      },
    )
  },
}
