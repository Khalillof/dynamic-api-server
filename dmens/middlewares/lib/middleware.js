import { isValidRole, dbStore, responce } from '../../common/index.js';
import fs from 'fs';
export class Middlewares {
    static async createInstance() {
        return await Promise.resolve(new Middlewares());
    }
    async getUserFromReq(req) {
        return req.body && req.body.email ? await dbStore['account'].findOne({ email: req.body.email }) : null;
    }
    checkLoginUserFields(req, res, next) {
        if (req.body) {
            let { email, username, password } = req.body;
            if (!username && email) {
                req.body.username = email;
            }
            ;
            if (!email && username) {
                req.body.email = username;
            }
            ;
            if (req.body.email && req.body.password) {
                next();
                return;
            }
        }
        responce(res).badRequest('Missing required body fields');
        return;
    }
    async validateSameEmailDoesntExist(req, res, next) {
        await this.getUserFromReq(req) ? responce(res).badRequest('User email already exists') : next();
    }
    validateCurrentUserOwnParamId(req, res, next) {
        req.user && String(req.user._id) === String(req.params['id']) ? next() : responce(res).unAuthorized();
    }
    validateBodyEmailBelongToCurrentUser(req, res, next) {
        (req.user && req.body.email === req.user.email) ? next() : responce(res).unAuthorized();
    }
    validateHasQueryEmailBelongToCurrentUser(req, res, next) {
        (req.user && req.query.email === req.user.email) ? next() : responce(res).forbidden('not authorized, require valid email');
    }
    async userExist(req, res, next) {
        await this.getUserFromReq(req) ? next() : responce(res).forbidden('User does not exist : ' + req.body.email);
    }
    isAuthenticated(req, res, next) {
        req.isAuthenticated() ? next() : responce(res).unAuthorized();
    }
    // roles
    isRolesExist(roles) {
        if (roles) {
            for (let r of roles) {
                if (!isValidRole(r)) {
                    return false;
                }
            }
        }
        return true;
    }
    ;
    isInRole(roleName) {
        return async (req, res, next) => {
            if (!req.isAuthenticated()) {
                responce(res).forbidden('require authentication');
                return;
            }
            let reqUser = req.user && req.user.roles ? req.user : await dbStore['account'].findById(req.user._id);
            let roles = await dbStore['role'].model.find({ _id: { $in: reqUser.roles } });
            if (roles) {
                for (let r of roles) {
                    if (r.name === roleName) {
                        next();
                        return;
                    }
                }
            }
            responce(res).forbidden("Require Admin Role!");
            return;
        };
    }
    isJson(req, res, next) {
        const toJsonNext = (data) => {
            req.body = JSON.parse(data);
            next();
        };
        if (req.body && req.header('content-type') === 'application/json') {
            toJsonNext(req.body);
        }
        else if (req.file && req.file.mimetype === 'application/json') {
            fs.readFile(req.file.path, 'utf8', (err, data) => {
                if (err) {
                    responce(res).error(err);
                }
                else {
                    toJsonNext(data);
                }
            });
        }
        else {
            responce(res).badRequest('content must be valid application/json');
        }
    }
}
