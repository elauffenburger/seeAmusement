import { NgModule } from '@angular/core';
import { NavbarComponent } from './navbar/navbar';
import { IonicModule } from 'ionic-angular';
import { ScoresSongComponent } from './scores-song/scores-song';
@NgModule({
	declarations: [NavbarComponent,
    ScoresSongComponent],
	imports: [IonicModule],
	exports: [NavbarComponent,
    ScoresSongComponent]
})
export class ComponentsModule {}
