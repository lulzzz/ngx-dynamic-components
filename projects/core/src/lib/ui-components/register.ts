import { CoreService } from '../services/core.service';
import { ComponentDescriptor } from '../models';
import { textDescriptor } from './text/text.component';
import { buttonDescriptor } from './button/button.component';
import { inputDescriptor } from './input/input.component';
import { iconDescriptor } from './icon/icon.component';
import { radioGroupDescriptor } from './radio-group/radio-group.component';
import { textareaDescriptor } from './textarea/textarea.component';
import { containerDescriptor, divDescriptor } from './container/container.component';
import { linkDescriptor } from './link/link.component';
import { labelDescriptor } from './label/label.component';
import { formDescriptor } from './form/form.component';
import { selectDescriptor } from './select/select.component';

export const COMPONENTS_LIST: ComponentDescriptor[] = [
  containerDescriptor,
  divDescriptor,
  formDescriptor,
  textDescriptor,
  labelDescriptor,
  iconDescriptor,
  inputDescriptor,
  radioGroupDescriptor,
  textareaDescriptor,
  buttonDescriptor,
  linkDescriptor,
  selectDescriptor
];

// Register components.
export function registerComponents(): void {
  COMPONENTS_LIST.forEach(component => CoreService.registerComponent(component));
}

export function getCategories(): {name: string, packageName: string, components: ComponentDescriptor[]}[] {
  const categories = COMPONENTS_LIST.reduce((map, desc) => {
    map[desc.category] = map[desc.category] || [];
    map[desc.category].push(desc);
    return map;
  }, {});

  return Object.entries(categories).map(([key, val]: [string, ComponentDescriptor[]]) => {
    return {
      name: key,
      components: val,
      packageName: 'core'
    };
  });
}
