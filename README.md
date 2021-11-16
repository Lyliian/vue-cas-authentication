Ce projet est un fork de celui de l'université de Strasbourg : https://gitlab.unistra.fr/vue-unistra/cas-authentication

# Installation 

yarn add https://github.com/Lyliian/vue-cas-authentication.git

# Configuration 

## Router

Création d'une instance de Vue-Router :

```javascript
import Vue from 'vue';
import VueRouter from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import ErrorPage from '@/views/ErroPage'

Vue.use(VueRouter);

let router = new VueRouter({
  mode: 'history',
  routes: [
      {
        path: '/',
        name: 'HelloWorld',
        component: HelloWorld,
        meta: {
          casAuthentication: true
        }
      },
      {
        path: '/auth/cas/logout',
        name: 'cas_authentication_logout',
      },
      {
        path: '/error/token',
        name: 'vue_cas_token_error',
        component: ErrorPage,
      },
  ],
});
```

Le Router doit être obligatoirement être initialisé à `mode: 'history'`.  
Si vous souhaitez utiliser le module CAS de déconnexion, 
créez au moins une route avec un `path` et un `name`, 
le name sera à passer dans le `main.js`.  
En cas d'erreur lors de la demande de token, le plugin redirige vers la route nommée `vue_cas_token_error`.  
Les routes qui seront protégées par CAS, doivent avoir la `meta: {casAuthentication: true}`. 
Cette solution est à privilégier lorsque vous souhaitez avoir des pages qui ne nécessitent pas d'authentification. Si vous souhaitez protéger globalement votre application, préférez l'option `appIsAllAuth` dans le `main.js` (cf. le point `Ajout du plugin à Vue` ci-dessous).

## Axios

Création d'une instance d'Axios : 

```javascript
import Vue from 'vue';
import Axios from 'axios';

let axios = Axios.create();

Vue.use(axios);
```

## Ajout du plugin à Vue

Dans le `main.js` ou le `index.js` :

```javascript
import Vue from 'vue';
import App from '@/App.vue';

import Cas from 'vue-cas-authentication';

[...] //instanciation du router et de Axios

const CasOptions = {
  router: router,
  axios: axios,
  options: {
    appIsAllAuth: true,
    authCasLogoutUrl: 'cas_authentication_logout',
    authServerUrl: 'https://ent.univ.fr/cas/validate',
    serverCAS: 'https://ent.univ.fr',
    tokenErrorRoutes: {
      /**@type number*/errorCode: /**@type string*/routeName,
    }
  },
};

Vue.use(Cas, CasOptions);

Vue.config.productionTip = false;

new Vue({
  axios: axios,
  router: router,
  store: store,
  render: h => h(App),
}).$mount('#app');
```

Le plugin va surcharger les instances du Router et d'Axios pour permettre de rajouter des options et des variables spécifiques au projet en cours.  

L'option `appIsAllAuth` permet d'indiquer que l'application nécessitera globalement d'une authentification.
Si vous faites le choix de cette solution, le paramètre `méta` n'est pas nécessaire au niveau du routeur.

Pour l'attribut `authCasLogoutUrl` il est nécessaire de mettre la même valeur que l'attribut `name` de votre route de déconnexion dans le routeur.

L'attribut `tokenErrorRoutes` permet de définir des routes spécifiques à appeler selon le code d'erreur donné par le server.
Par exemple s'il vaut `{403: 'ForbiddenPage'}` le plugin routera vers `ForbiddenPage` si le server jwt renvoie une erreur 403, 
et vers la route nommée `vue_cas_token_error` pour tout autre code d'erreur.
