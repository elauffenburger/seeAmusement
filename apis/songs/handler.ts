import { APIGatewayEvent, Context, Callback, Handler } from 'aws-lambda';

import { GetAllSongsArgs } from './src/common/services/songs';
import { makeServiceProvider } from './src/common/helpers';

const services = makeServiceProvider();
export const hello: Handler = (event, context, cb) => {
  cb(null,
    { message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!', event }
  )
};