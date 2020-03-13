import { Component } from '@angular/core';
import { BaseUIComponent } from '../../components/base-ui-component';
import { StyleProperties, propDescription, PropertyCategories } from '../../properties';
import { ComponentExample, UIModel, ComponentDescriptor, Categories, AttributesMap, XMLResult } from '../../models';

@Component({
  selector: 'dc-button',
  template: `
    <a *ngIf="properties.type == 'link' else btn"
      [ngClass]="btnClass" [ngStyle]="itemStyles" [href]="properties.href">{{properties.label}}</a>
    <ng-template #btn>
      <button [ngClass]="btnClass"
        [type]="properties.type || 'button'" [ngStyle]="itemStyles"
        (click)="onClick()">{{properties.label}}</button>
    </ng-template>
  `
})
export class ButtonComponent extends BaseUIComponent<ButtonProperties> {
  async onClick() {
    const clickKey = this.properties['on-click'];
    if (clickKey) {
      this.evaluate.emit(true);
      try {
        await this.interpreter.evaluate(this.scripts, {dataModel: this.dataModel, uiModel: this.uiModel}, clickKey);
        this.changedDataModel.emit(this.dataModel);
      } finally {
        this.evaluate.emit(false);
      }
    }
  }

  get btnClass() {
    return {
      [`${this.properties.class}`]: this.properties.class
    };
  }
}

export class ButtonProperties extends StyleProperties {
  @propDescription({
    description: 'Button label',
    example: 'Click me!',
  })
  label: string;

  @propDescription({
    description: 'Key for action that fires onclick',
    example: 'submit',
  })
  'on-click'?: string;

  @propDescription({
    description: 'Button type: button|submit|reset|link. Default: button',
    example: 'submit',
  })
  type?: string;

  @propDescription({
    description: 'Link href used in case of type=link.',
    example: 'submit',
  })
  href?: string;
}

export const example: ComponentExample<UIModel<ButtonProperties>> = {
  title: 'Basic button example',
  uiModel: `
  <button class="btn btn-primary" width="50%" margin="15px" padding="10px 5px 10px 0px" on-click="consoleLog" type="button">Click</button>
  `,
  scripts: `
  def consoleLog():
    print("test")
  `,
  dataModel: {}
};

interface ButtonComponentConstrutor {
  new (): ButtonComponent;
}

interface ButtonPropertiesConstrutor {
  new (): ButtonProperties;
}

export const buttonDescriptor: ComponentDescriptor<ButtonComponentConstrutor, ButtonPropertiesConstrutor> = {
  name: 'button',
  label: 'Button',
  packageName: 'core',
  category: Categories.Basic,
  description: 'Button component',
  itemProperties: ButtonProperties,
  component: ButtonComponent,
  example,
  parseUIModel(xmlRes: XMLResult): UIModel {
    const content = xmlRes.content;
    const itemProperties: AttributesMap = {};
    if (typeof content === 'string') {
      itemProperties.label = content;
    }

    return {
      type: 'button',
      itemProperties: { label: content }
    };
  },
  defaultModel: {
    type: `core:button`,
    containerProperties: {},
    itemProperties: {
      label: 'Label',
      'on-click': 'consoleLog',
      btnClass: 'btn-primary',
      type: 'button'
    }
  },
  propertiesDescriptor: [
    ['type', {name: 'type', label: 'Type', category: PropertyCategories.Main,
      combo: [['button', 'submit', 'reset']]
    }]
  ]
};