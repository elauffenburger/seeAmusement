import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { NgForOfContext } from '@angular/common';

@Component({
  selector: 'item-group-accordion',
  templateUrl: 'item-group-accordion.html'
})
export class ItemGroupAccordionComponent<T = any> {
  isVisible = false;

  @Input()
  color: string;

  @Input()
  groupName: string;

  @Input()
  items: T[];

  @ContentChild(TemplateRef)
  contentTemplate: TemplateRef<{ item: T }>;

  constructor() { }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }
}
