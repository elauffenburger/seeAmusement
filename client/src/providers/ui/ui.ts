import { Injectable } from '@angular/core';
import { GetSongsScoresResponse, SongsProvider } from '../songs/songs';
import { AlertController, LoadingController } from 'ionic-angular';
import { SessionProvider } from '../session/session';

export interface TryGetSongsArgs {
  hideLoader?: boolean;

  getSongsFn: (songs: SongsProvider) => Promise<GetSongsScoresResponse>;
  afterGetSongsFn?: (songs: GetSongsScoresResponse) => Promise<any>;
}

@Injectable()
export class UiProvider {
  constructor(private songs: SongsProvider, private alert: AlertController, private session: SessionProvider, private loader: LoadingController) { }

  async tryGetSongs(args: TryGetSongsArgs): Promise<GetSongsScoresResponse> {
    const loader = this.loader.create({ content: 'Loading...' });

    if (!args.hideLoader) {
      loader.present();
    }

    try {
      return await this.tryGetSongsRec(args);
    } finally {
      if (!args.hideLoader) {
        loader.dismiss();
      }
    }
  }

  private async tryGetSongsRec(args: TryGetSongsArgs): Promise<GetSongsScoresResponse> {
    try {
      const response = await args.getSongsFn(this.songs);

      // If everything went smoothly, there's nothing else to do!
      if (!response.error) {
        if (args.afterGetSongsFn) {
          await args.afterGetSongsFn(response);
        }

        return response;
      }

      // ...otherwise, we need to handle the error
      switch (response.error) {
        case 'no-auth':
          this.alert
            .create({
              message: 'Authentication Failed!',
              buttons: [
                {
                  text: 'Login',
                  handler: () => {
                    // Login and try again
                    this.session.login()
                      .then(() => {
                        return this.tryGetSongsRec(args);
                      });
                  }
                }
              ]
            })
            .present();

          return response;
        case 'unknown':
          this.alert.create({ message: 'Some unknown error occurred' });

          return response;
      }
    } catch (e) {
      console.error('Something went critically wrong while getting songs!');
      console.error('errors: ', JSON.stringify(e));

      throw e;
    }
  }
}
