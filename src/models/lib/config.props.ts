"use strict";
import { Svc } from '../../common/index.js';

import { IConfigProps, IConfigPropsParameters, IForm } from '../../interfaces/index.js';
import { Form } from '../index.js';

export class ConfigProps implements IConfigProps {

  constructor(_config: IConfigPropsParameters) {
    let { name, active, schemaObj, schemaOptions, routeName, useAuth, useAdmin, postPutMiddlewares, displayName } = _config;

    // basic validation
    if (!name || !schemaObj) {
      throw new Error(`ConfigProps class constructor is missing requird properties => ${_config}`);
    }

    if (Svc.db.exist(name.toLowerCase())) {
      throw new Error(`ConfigProps basic schema validation faild ! name property : ${name} already on db.`);
    }


    this.name = name.toLowerCase(),
    this.active = active || false,
    this.schemaObj = schemaObj || {},
    this.schemaOptions = { timestamps: true, strict: true, ...schemaOptions }

    this.routeName = routeName && routeName?.toLocaleLowerCase() || Svc.routes.pluralizeRoute(name),
    this.useAuth = this.removeDiplicates(useAuth),
    this.useAdmin = this.removeDiplicates(useAdmin)
    this.postPutMiddlewares = this.removeDiplicates(postPutMiddlewares)
    this.displayName = displayName || this.routeName.replace('/','')

  }

  name: string
  active: Boolean
  schemaObj: object
  schemaOptions?: Record<string, any>
  routeName: string
  displayName:string
  useAuth: string[]
  useAdmin: string[]
  postPutMiddlewares: string[] // used for post put actions

  private removeDiplicates(arr?: any[]) {
    // Set will remove diblicate
    return (arr && Array.isArray(arr)) ? Array.from(new Set(arr)) : []
  }
  getProps(): IConfigProps { 
    return {
      name: this.name,
      active: this.active,
      schemaObj: this.schemaObj,
      schemaOptions: this.schemaOptions,
      routeName: this.routeName,
      useAuth: this.useAuth,
      useAdmin: this.useAdmin,
      displayName:this.displayName,
      postPutMiddlewares:this.postPutMiddlewares
    }
  }

  getRoutes(){
  return Svc.routes.getRoutesPathMethods(this.routeName)
  }

  async genForm(): Promise<IForm> {
    return await new Form(this).genElements(this)
  }

  //check useAuth and useAdmin and return full list of middlewares
  authAdminMiddlewares(actionName: string): string[] {
    let result:string[]= [];
    this.inAuth(actionName) &&  result.push('authenticate')
    this.inAdmin(actionName) && result.push('isAdmin')

    return result;
  }


  inAuth(action:string):boolean{
   return this.useAuth.indexOf(action) !== -1
  }
  inAdmin(action:string):boolean{
   return this.useAdmin.indexOf(action) !== -1
  }
}
