import { Component, HostBinding, OnInit, HostListener } from '@angular/core';
import { BaseUIComponent } from '../../components/base-ui-component';
import { StyleProperties, propDescription, PropertyCategories } from '../../properties';
import { ComponentExample, UIModel, ComponentDescriptor, Categories, AttributesMap, XMLResult } from '../../models';

@Component({
  selector: 'button', // tslint:disable-line
  template: `
  {{properties.label}}
  `
})
export class ButtonComponent extends BaseUIComponent<ButtonProperties> implements OnInit {

  @HostBinding('attr.type') type = 'button';
  @HostBinding('attr.disabled') disabled = null;
  @HostListener('click')
  onClick(): void {
    this.emitEvent(this.properties.onClick);
    this.changedDataModel.emit(this.dataModel);
  }

  ngOnInit(): Promise<void> {
    if (this.properties.type) {
      this.type = this.properties.type;
    }

    if (this.properties.disabled === true) {
      this.disabled = true;
    }

    return super.ngOnInit();
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
    example: 'onBtnClick()',
  })
  onClick?: string;

  @propDescription({
    description: 'Button type: button|submit|reset|link. Default: button',
    example: 'submit',
  })
  type?: string;

  @propDescription({
    description: 'It specifies that the button should be disabled.',
    example: 'true',
  })
  disabled?: boolean;
}

export const example: ComponentExample<UIModel<ButtonProperties>> = {
  title: 'Basic button example',
  uiModel: `
  <section class="row align-items-center">
    <button class="btn btn-primary" width="50%" margin="15px" padding="10px 5px 10px 0px" onClick="consoleLog">Click</button>
    <button class="btn btn-secondary" disabled="true" onClick="consoleLog" type="submit">Submit</button>
    <button class="btn btn-danger" display="none">Hidden</button>
  </section>
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
      itemProperties
    };
  },
  defaultModel: {
    type: `button`,
    containerProperties: {},
    itemProperties: {
      label: 'Label',
      onClick: 'consoleLog',
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