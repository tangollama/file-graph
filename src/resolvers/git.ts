import { simpleGit, SimpleGit, SimpleGitOptions, Options } from 'simple-git';
//import fs from 'fs/promises';
import path from 'path';
import date from 'date-and-time';

const options: Partial<SimpleGitOptions> = {
  baseDir: path.join(process.cwd(), '/content'),
  binary: 'git',
  maxConcurrentProcesses: 6,
  trimmed: false,
};

// when setting all options in a single object
const git: SimpleGit = simpleGit(options);

export const resolvers = {
  Query: {
    gitStatus: async (parent, args, ctx) => {
      const results = await git.status();
      delete results.ahead;
      delete results.behind;
      delete results.current;
      delete results.tracking;
      delete results.detached;
      delete results.isClean;

      console.debug(results);
      return results;
    },
  },
  Mutation: {
    gitAdd: async (parent, args, ctx) => {
      return await git.add(args.files, (err, result) => {
        if (err) {
          console.error(err);
          return false;
        } else {
          console.debug('Git Add', result);
          return true;
        }
      });
    },
    gitCommit: async (parent, args, ctx) => {
      let { files, all, message } = args;
      if (all) {
        const status = await git.status();
        console.debug('Called git status', status);
        files = status.files.map((f) => path.join('../', f.path));
      }
      if (!message) {
        const now = new Date();
        message = `Recent file commits on ${date.format(now, 'YYYY/MM/DD HH:mm:ss')}`;
      }
      console.debug(`Calling git commit ${message}`, files);
      await git.add(files, (err, result) => {
        if (err) {
          console.error(err);
          return false;
        } else {
          console.debug(result);
          return true;
        }
      });
      await git.commit(message, (err, result) => {
        if (err) {
          console.error(err);
          return false;
        } else {
          console.debug(result);
          return true;
        }
      });
      console.debug('Exiting gitCommit');
      return true;
    },
    gitPush: async (/*parent, args, ctx*/) => {
      const gPull = await git.pull((err, result) => {
        if (err) {
          console.error(err);
          return false;
        } else {
          console.debug('Git Pull', result);
          return true;
        }
      });
      if (gPull) {
        const gPush = await git.push((err, result) => {
          if (err) {
            console.error(err);
            return false;
          } else {
            console.debug('Git Push', result);
            return true;
          }
        });
        if (gPush) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },
  },
};
