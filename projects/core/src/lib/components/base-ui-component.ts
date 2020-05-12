import { OnInit, Input, OnDestroy, Output, EventEmitter, HostBinding, SimpleChanges, OnChanges, Directive } from '@angular/core';
import { UIModel, AttributesMap, ComponentEvent } from '../models';
import { JSONUtils } from '../utils/json.utils';
import { kebabStrToCamel, parseArgFunction } from '../utils';
import { StyleProperties, DataModelProperties, StylePropertiesList, BaseProperties } from '../properties';
import { InputProperties } from '../ui-components/input/input.component';

@Directive()
// tslint:disable-next-line
export class BaseUIComponent<T = StyleProperties> implements OnInit, OnDestroy, OnChanges {
    @Input() dataModel: any;
    @Input() uiModel: UIModel<T>;
    element: HTMLElement;
    @Output() eventHandlers = new EventEmitter<ComponentEvent>();
    @HostBinding('style.width') width: string;
    @HostBinding('style.min-width') minWidth: string;
    @HostBinding('style.max-width') maxWidth: string;
    @HostBinding('style.height') height: string;
    @HostBinding('style.min-height') minHeight: string;
    @HostBinding('style.max-height') maxHeight: string;
    @HostBinding('style.padding') padding: string;
    @HostBinding('style.margin') margin: string;
    @HostBinding('style.display') display = 'initial';
    @HostBinding('style.border-left') borderLeft: string;
    @HostBinding('style.border-top') borderTop: string;
    @HostBinding('style.border-right') borderRight: string;
    @HostBinding('style.border-bottom') borderBottom: string;
    @HostBinding('style.background') background: string;
    @HostBinding('class') classAttr: string;

    @Output() changedDataModel = new EventEmitter();

    protected readonly hostBindings = ['width', 'height', 'padding', 'margin', 'background', 'display',
    'minHeigh', 'maxHeight', 'minWidth', 'maxWidth', 'visible'];
    private readonly borders = ['border-left', 'border-top', 'border-right', 'border-bottom'];

    async ngOnInit(): Promise<void> {
      this.setHostStyles();
      this.emitEvent((this.properties as BaseProperties).onInit);
    }

    async ngOnDestroy(): Promise<void> {
      this.emitEvent((this.properties as BaseProperties).onDestroy);
    }

    async ngOnChanges({dataModel, uiModel}: SimpleChanges): Promise<void> {
      if (dataModel && !dataModel.firstChange && this.dataModel !== dataModel.currentValue) {
        this.dataModel = dataModel.currentValue;
      }

      if (uiModel && !uiModel.firstChange) {
        this.uiModel = uiModel.currentValue;
        this.setHostStyles();
      }
    }

    create(locationElement: HTMLElement): void {
      this.element = locationElement;
    }

    get componentDataModel(): any {
      if (this.properties.hasOwnProperty('dataSource')) {
        const value = (this.properties as DataModelProperties).dataSource;
        if (typeof value === 'object') {
          return value;
        } else if (typeof value === 'string' &&  this.dataModel.hasOwnProperty(value)) {
          return this.dataModel[value];
        }
      }

      if (this.properties.hasOwnProperty('binding')) {
        const path = (this.properties as DataModelProperties).binding;
        // TODO: Handle case for Array type.
        if (!Array.isArray(this.dataModel)) {
          return JSONUtils.find(this.dataModel, path);
        }
      }

      if (this.properties.hasOwnProperty('value')) {
        return (this.properties as InputProperties).value;
      }
    }

    set componentDataModel(val) {
      if (this.properties.hasOwnProperty('binding')) {
        const path = (this.properties as DataModelProperties).binding;
        JSONUtils.setValue(this.dataModel, path, val);
      }
    }

    get properties(): T {
      return this.uiModel.itemProperties;
    }

    protected emitEvent(funcSign: string, parameters: any = null): void {
      if (funcSign) {
        const [eventName, parameter] = parseArgFunction(funcSign);
        this.eventHandlers.emit({
          eventName,
          parameters: {
            uiModel: this.uiModel,
            [parameter]: parameters
          }
        });
      }
    }

    get itemStyles(): {[key: string]: string} {
      return this.getStyles(this.properties);
    }

    getStyles(properties: StyleProperties = {}, stylesList = StylePropertiesList): {[key: string]: string} {
      return stylesList.reduce((styles, prop) => {
        if (properties.hasOwnProperty(prop)) {
          styles[prop] = this.getPropValue(properties, prop);
        }
        return styles;
      }, {});
    }

    protected setHostStyles(): void {
      const props = this.properties as StyleProperties;
      if (props.class) {
        this.classAttr = props.class;
      }
      if (props) {
        this.hostBindings.forEach(b => {
          if (props && props.hasOwnProperty(b)) {
            this[b] = props[b];
          }
        });
        this.setBorder(props);
      }
    }

    private getPropValue(properties: AttributesMap, prop: string): any {
      const val = properties[prop];
      if (prop === 'font-size') {
        if (!isNaN(properties[prop])) {
          return `${val}px`;
        }
      }
      return val;
    }

    private setBorder(properties: StyleProperties): void {
      const border = properties.border;
      if (typeof border === 'string') {
        const [prop, value] = border.split('|');
        if (prop === 'border') {
          this.borders.forEach(b => {
            this[kebabStrToCamel(b)] = value;
          });
        } else {
          this[kebabStrToCamel(prop)] = value;
        }
      }
    }
}
