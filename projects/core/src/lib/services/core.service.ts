import { Injectable } from '@angular/core';
import * as xml from 'xml2js';
import { ComponentDescriptor, UIModel, AttributesMap, XMLResult } from '../models';
import { BaseUIComponentConstructor } from '../utils';
import { ControlProperties, UIModelProperty } from '../properties';

/**
 * Child Elements directives within Containers
 * @link https://github.com/angular/flex-layout/wiki/API-Documentation
 */
const FX_CONTAINER_DIRECTIVES = ['fxFlex', 'fxFlexOrder', 'fxFlexOffset', 'fxFlexAlign', 'fxflexfill'];

@Injectable({
  providedIn: 'root'
})
export class CoreService {
  private static COMPONENTS_REGISTER = new Map<string, ComponentDescriptor>();

  public static registerComponent(desc: ComponentDescriptor) {
    const {name, packageName, propertiesDescriptor} = desc;
    if (propertiesDescriptor) {
      propertiesDescriptor.forEach(prop => {
        ControlProperties.set(`${packageName}:${name}:${prop[0]}`, prop[1]);
      });
    }
    const key = packageName === 'core' ? name : `${packageName}:${name}`;
    CoreService.COMPONENTS_REGISTER.set(key, desc);
  }

  public static getComponent(type: string): BaseUIComponentConstructor {
    if (CoreService.COMPONENTS_REGISTER.has(type)) {
      return CoreService.COMPONENTS_REGISTER.get(type).component;
    }

    throw new Error(`Component ${type} is not registered`);
  }

  public static getComponentDescriptor(type: string): ComponentDescriptor {
    if (CoreService.COMPONENTS_REGISTER.has(type)) {
      return CoreService.COMPONENTS_REGISTER.get(type);
    }

    throw new Error(`ComponentDescriptor ${type} is not registered`);
  }

  public static getComponentProperties(type: string): UIModelProperty[] {
    try {
      const desc = CoreService.getComponentDescriptor(type);
      return desc.itemProperties.prototype.properties;
    } catch (e) {
      throw e;
    }
  }

  public static getListOfComponents(): Array<ComponentDescriptor> {
    return Array.from(CoreService.COMPONENTS_REGISTER.values());
  }

  public static async parseXMLModel(uiModelXml: string): Promise<UIModel> {
    try {
      const res = await xml.parseStringPromise(uiModelXml, {
        explicitChildren: true,
        preserveChildrenOrder: true
      });
      const type = Object.keys(res)[0];
      const xmlObj = res[type];
      return CoreService.getUIModel(CoreService.getXMLResult(xmlObj));
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public static getPropertiesFromAttributes(attrs: any = {}): {containerProperties: AttributesMap, itemProperties: AttributesMap} {
    const itemProperties = {};
    const containerProperties = {};
    Object.entries(attrs).forEach(([prop, val]) => {
      if (FX_CONTAINER_DIRECTIVES.includes(prop)) {
        containerProperties[prop] = val;
      } else {
        itemProperties[prop] = val;
      }
    });

    return { containerProperties, itemProperties };
  }

  public static getXMLResult(xmlObj: any): XMLResult {
    return {
      type: xmlObj['#name'],
      attrs: xmlObj.$ || {},
      childNodes: xmlObj.$$,
      content: xmlObj._
    };
  }

  public static getUIModel(xmlRes: XMLResult): UIModel {
    const attrs = xmlRes.attrs;
    const type = xmlRes.type;
    const { itemProperties, containerProperties } = CoreService.getPropertiesFromAttributes(attrs);
    if (CoreService.COMPONENTS_REGISTER.has(type)) {
      const uiModel: UIModel = {
        type,
        itemProperties,
        containerProperties
      };

      const descr = CoreService.COMPONENTS_REGISTER.get(type);
      if (typeof descr.parseUIModel === 'function') {
        const typeUIModel = descr.parseUIModel(xmlRes);
        uiModel.itemProperties = { ...itemProperties, ...typeUIModel.itemProperties };
        uiModel.children = typeUIModel.children;
      }

      if (attrs.id) {
        uiModel.id = attrs.id;
      }

      if (xmlRes.childNodes && !uiModel.children) {
        uiModel.children = xmlRes.childNodes.map((r: any) => CoreService.getUIModel(CoreService.getXMLResult(r)));
      }
      return uiModel;
    }
  }
}