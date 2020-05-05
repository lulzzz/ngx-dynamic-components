import { Component, OnInit, HostBinding, HostListener } from '@angular/core';
import { propDescription } from '../../properties';
import { ComponentExample, UIModel, ComponentDescriptor, Categories, XMLResult } from '../../models';
import { FormElementComponent, FormElementProperties } from '../../components/form-element-component';

@Component({
  selector: 'textarea', // tslint:disable-line
  template: '{{value}}'
})
export class TextareaComponent extends FormElementComponent<TextareaProperties> implements OnInit {
  @HostBinding('attr.cols') cols: number;
  @HostBinding('attr.rows') rows: number;

  @HostListener('input', ['$event.target'])
  onInput(txtArea: HTMLTextAreaElement): void {
    this.componentDataModel = txtArea.value;
    this.emitEvent(this.properties.onInput, txtArea.value);
    this.changedDataModel.emit(this.dataModel);
  }

  async ngOnInit(): Promise<void> {
    await super.ngOnInit();
    this.cols = this.properties.cols || undefined;
    this.rows = this.properties.rows || undefined;
    this.value = this.componentDataModel;
  }
}

export class TextareaProperties extends FormElementProperties {
  @propDescription({
    description: 'Number of rows in textarea',
    example: '5',
  })
  rows?: number;

  @propDescription({
    description: 'The visible width of the text control',
    example: '20',
  })
  cols?: number;
}

export const example: ComponentExample<UIModel<TextareaProperties>> = {
  title: 'Text area example',
  uiModel: `
  <textarea binding="$.info" placeholder="Type information about yourself" rows="10"></textarea>
  `,
  dataModel: {
    info: 'Data model textarea value'
  }
};

interface TextareaComponentConstrutor {
  new(): TextareaComponent;
}

interface TextareaPropertiesConstrutor {
  new(): TextareaProperties;
}

export const textareaDescriptor: ComponentDescriptor<TextareaComponentConstrutor, TextareaPropertiesConstrutor> = {
  name: 'textarea',
  label: 'Text Area',
  packageName: 'core',
  category: Categories.Basic,
  description: 'Text area component',
  itemProperties: TextareaProperties,
  component: TextareaComponent,
  example,
  parseUIModel(xmlRes: XMLResult): UIModel {
    const itemProperties: TextareaProperties = {
      readonly: xmlRes.attrs.readonly === 'true'
    };
    return {
      type: 'textarea',
      itemProperties
    };
  },
  defaultModel: '<textarea binding="$.info" rows="5"></textarea>',
  children: false
};
