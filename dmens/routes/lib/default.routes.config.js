import { corsWithOptions } from "./cors.config.js";
import { Svc, Assert, envs } from '../../common/index.js';
import { middlewares } from '../../middlewares/index.js';
import { DefaultController } from '../../controllers/index.js';
import { appRouter } from '../../app.js';
export class DefaultRoutesConfig {
    router;
    config;
    controller;
    mware;
    constructor(controller, callback) {
        if (!(controller instanceof DefaultController)) {
            envs.throwErr('route configration require instance of class DefaultController');
        }
        this.controller = controller;
        this.config = controller.db.config;
        this.router = appRouter;
        this.mware = middlewares;
        typeof callback === 'function' ? callback.call(this) : this.defaultRoutes();
        // add instance to routeStore
        Svc.routes.add(this);
    }
    addRoutePath(name) {
        return this.config.routeData.baseRoutePath + (name.startsWith('/') ? name : '/' + name);
    }
    // custom routes
    async buidRoute(route_path, method, actionName, middlewares = []) {
        if (!route_path)
            throw new Error('buildRoute method require url or routeName');
        // remove diplicates
        middlewares = Array.from(new Set([...middlewares, ...this.controller?.db.config.authAdminMiddlewares(actionName ?? method)]));
        let mdwrs = this.mware;
        // map middlewares string fuction names to actual functions
        let mdwares = middlewares.map((m) => mdwrs[m]);
        return this.router[((method === 'list') ? 'get' : method)](route_path, ...mdwares, this.actions(actionName ?? method));
    }
    setOptions(routPath) {
        this.router.options(routPath, corsWithOptions);
    }
    options() {
        this.setOptions(this.config.routeData.routeName);
        this.setOptions(this.config.routeData.routeParam);
    }
    setParam() {
        return this.router.param(this.config.routeData.paramId, async (req, res, next, id) => {
            try {
                Assert.idString(id);
                next();
            }
            catch (err) {
                res.json({ success: false, error: err.message });
                envs.logLine(err.stack);
            }
        });
    }
    async defaultRoutes() {
        await this.buidRoute(this.config.routeData.baseRoutePath + '/search', 'list', 'search'); // search
        await this.buidRoute(this.config.routeData.baseRoutePath + '/count', 'get', 'count'); // count
        await this.buidRoute(this.config.routeData.baseRoutePath + '/form', 'get', 'form'); // get form elements
        await this.buidRoute(this.config.routeData.baseRoutePath + '/route', 'get', 'route'); // get form routes
        await this.buidRoute(this.config.routeData.baseRoutePath + '/routedata', 'get', 'routedata'); // get model routeData
        await this.buidRoute(this.config.routeData.baseRoutePath, 'list', 'list'); // list
        await this.buidRoute(this.config.routeData.routeParam, 'get', 'getOne'); // get by id
        await this.buidRoute(this.config.routeData.baseRoutePath, 'get', 'getOne'); // getOne by filter parameter
        await this.buidRoute(this.config.routeData.routeName, 'post', null, this.controller?.db.config.postPutMiddlewares); // post
        await this.buidRoute(this.config.routeData.routeParam, 'put', null, this.controller?.db.config.postPutMiddlewares); // put
        await this.buidRoute(this.config.routeData.routeParam, 'delete', null, ['validateCurrentUserOwnParamId']); // delete
        this.setParam();
        this.options();
    }
    actions(actionName) {
        return this.controller.tryCatch(actionName);
    }
}
