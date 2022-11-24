import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import polka from 'polka';

import typeDefs from './gql/schema';
import resolvers from './resolvers';

const PORT = process.env.PORT || 3000;

let schema = makeExecutableSchema({
  typeDefs: [...typeDefs],
  resolvers,
});

const server = new ApolloServer({
  schema,
  context: ({ req, res }) => {
    return { req, res };
  },
});

!(async () => {
  await server.start();

  const app = polka().use(
    cors({
      origin: (o, cb) => cb(null, true),
    }),
  );

  server.applyMiddleware({ app, path: '/graphql' });
  app.listen(PORT, () => console.log(`Learn.Bible GraphQL API running on port ${PORT}`));
})();