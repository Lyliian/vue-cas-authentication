import {PluginFunction} from 'vue';
import VueRouter from 'vue-router';
import {AxiosInstance} from 'axios';

interface installOptions {
    router: VueRouter;
    axios: AxiosInstance;
    options?: {
        appIsAllAuth?: boolean;
        authCasLogoutUrl?: string;
        authServerUrl?: string;
        serverCAS?: string;
        tokenErrorRoutes?: {
            default: string;
            [status: string]: string;
        }
    }
}

declare class CasAuthentication {
    static install: PluginFunction<installOptions>;
}

export default CasAuthentication
