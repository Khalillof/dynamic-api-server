import { corsWithOptions } from "./cors.config.js";
import { routeStore, Assert, envConfig } from '../../common/index.js';
import { middlewares } from '../../middlewares/index.js';
import { DefaultController } from '../../controllers/index.js';
import { authenticateUser } from '../../services/index.js';
import { app } from '../../app.js';
import { ConfigProps } from "../../models/index.js";
export class DefaultRoutesConfig {
    app;
    configProp;
    routeName;
    routeParam;
    controller;
    mware;
    authenticate;
    //actions:Function;
    constructor(configProp, controller, callback) {
        if (!(configProp instanceof ConfigProps)) {
            envConfig.throwErr('route configration require instance of class ConfigProp');
        }
        this.configProp = configProp;
        this.app = app;
        this.routeName = configProp.routeName;
        this.routeParam = this.routeName + '/:id';
        this.controller = controller || new DefaultController(configProp.name);
        this.mware = middlewares;
        this.authenticate = authenticateUser;
        typeof callback === 'function' ? callback.call(this) : this.defaultRoutes();
        // add instance to routeStore
        routeStore[this.routeName] = this;
        envConfig.logLine('Added ( ' + this.routeName + ' ) to routeStore');
    }
    async buildMdWares(middlewares, useAuth = true, useAdmin = false) {
        let mdwares = [];
        if (useAuth === true)
            mdwares = [...mdwares, this.authenticate(envConfig.authStrategy())]; //  authStr === 'az' ? 'oauth-bearer' :  jwt; ;
        if (useAdmin === true)
            mdwares = [...mdwares, this.mware.isInRole('admin')];
        if (middlewares)
            mdwares = [...mdwares, ...middlewares];
        return mdwares;
    }
    // custom routes
    async buidRoute(routeName, method, actionName, secondRoute, middlewares) {
        const url = secondRoute ? (routeName + '/' + secondRoute) : routeName;
        let aut = this.configProp.checkAuth(method) || [true, false];
        let mdwr = await this.buildMdWares(middlewares, ...aut);
        return this.app[(method === 'list' ? 'get' : method)](url, ...mdwr, this.actions(actionName ?? method));
    }
    options(routPath) {
        this.app.options(routPath, corsWithOptions);
    }
    param() {
        return this.app.param('id', async (req, res, next, id) => {
            try {
                Assert.idString(id);
                next();
            }
            catch (err) {
                res.json({ success: false, error: err.message });
                envConfig.logLine(err.stack);
            }
        });
    }
    async defaultRoutes() {
        await this.buidRoute(this.routeName, 'list', 'search', 'search'); // search
        await this.buidRoute(this.routeName, 'list', 'count', 'count'); // count
        await this.buidRoute(this.routeName, 'list', 'list'); // list
        await this.buidRoute(this.routeParam, 'get', 'getOne'); // get By id
        await this.buidRoute(this.routeName, 'get', 'getOne'); // getOne by filter parameter
        await this.buidRoute(this.routeName, 'post'); // post
        await this.buidRoute(this.routeParam, 'put'); // put
        await this.buidRoute(this.routeParam, 'delete', null, null, [this.mware.validateCurrentUserOwnParamId]); // delete
        this.param();
        this.options(this.routeName);
        this.options(this.routeParam);
    }
    actions(actionName) {
        return this.controller.tryCatch(actionName);
    }
}
