import { NgModule } from '@angular/core';
import { NavbarComponent } from './navbar/navbar';
import { IonicModule } from 'ionic-angular';
import { ScoresSongComponent } from './scores-song/scores-song';
import { ItemGroupAccordionComponent } from './item-group-accordion/item-group-accordion';
@NgModule({
	declarations: [NavbarComponent,
    ScoresSongComponent,
    ItemGroupAccordionComponent],
	imports: [IonicModule],
	exports: [NavbarComponent,
    ScoresSongComponent,
    ItemGroupAccordionComponent]
})
export class ComponentsModule {}
