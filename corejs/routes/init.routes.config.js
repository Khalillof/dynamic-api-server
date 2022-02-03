"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const {IndexRoutes} =require('./index.routes.config');
const {UsersRoutes} = require('./users.routes.config');
const {AuthRoutes} = require('./auth.routes.config');
const {DefaultRoutesConfig} = require('./default.routes.config');

async function initializeRoutes(app){
 
   await DefaultRoutesConfig.createInstancesWithDefault(app,['/dishes', '/leaders', '/favorites', '/promotions']);
   await IndexRoutes(app);
   await AuthRoutes(app);
   await UsersRoutes(app);  

  return await Promise.resolve(availableRoutesToString(app))
  } 

  // helpers
  function availableRoutesToString(app) {
    let result = app._router.stack
      .filter((r) => r.route)
      .map((r) => Object.keys(r.route.methods)[0].toUpperCase().padEnd(7) + r.route.path)
      .join("\n");
      
      console.log('================= All Routes avaliable ================ \n'+ result)
  }
  function availableRoutesToJson(app) {
    let result = app._router.stack
        .filter((r) => r.route)
        .map((r) => {
        return {
            method: Object.keys(r.route.methods)[0].toUpperCase(),
            path: r.route.path
        };
    });
    console.log('================= All Routes avaliable ================ \n'+ JSON.stringify(result, null, 2))
    //console.log(JSON.stringify(result, null, 2));
  }

  exports.initializeRoutes = initializeRoutes;
