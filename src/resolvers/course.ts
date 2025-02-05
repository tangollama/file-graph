import {
  TYPENAMES,
  getSourceFile,
  writeSourceFile,
  setupCourseDirs,
  hasValidPageFields,
} from '../utils';
import kebabCase from 'lodash.kebabcase';

export const resolvers = {
  Query: {
    course: async (parent, args, ctx) => {
      return await getSourceFile(args.id, ctx, TYPENAMES.COURSE);
    },
    listCourses: async (parent, args, ctx) => {
      //console.debug(ctx);
      const courseList = Object.keys(ctx.schema).filter(
        (key) => ctx.schema[key].typename === TYPENAMES.COURSE,
      );
      return courseList;
    },
  },
  Mutation: {
    saveCourse: async (parent, args, ctx) => {
      const { title, version, subtitle, author, units } = args.input;
      const courseId = args.input.id || kebabCase(title);
      let courseFile = await getSourceFile(courseId, ctx, TYPENAMES.COURSE);
      if (!courseFile) {
        console.debug(`Setting up a course directory for ${courseId}`);
        await setupCourseDirs(courseId);
        courseFile = {};
      }
      courseFile.id = courseId || courseFile.id;
      courseFile.type = TYPENAMES.COURSE;
      courseFile.title = title || courseFile.title;
      courseFile.version = version || courseFile.version;
      courseFile.subtitle = subtitle || courseFile.subtitle;
      courseFile.author = author || courseFile.author;
      if (units) {
        courseFile.units = await Promise.all(
          units.map(async (unit: any): Promise<any> => {
            unit.id = unit.id || kebabCase(unit.title);
            unit.type = TYPENAMES.UNIT;
            //cycle through the pages and save them if they're present
            if (unit.pages) {
              unit.pages = await Promise.all(
                unit.pages.map(async (p) => {
                  p.id = p.id || kebabCase(p.title);
                  if (hasValidPageFields(p)) {
                    //save the page file
                    //console.debug(`Writing page ${p.id}`);
                    await writeSourceFile(
                      ctx,
                      p.id,
                      TYPENAMES.PAGE,
                      {
                        id: p.id,
                        type: TYPENAMES.PAGE,
                        title: p.title,
                      },
                      p.content,
                      courseId,
                    );
                  } else {
                    console.warn(`Page did not contain the correct fields`, p);
                  }
                  return p.id;
                }),
              );
            }
            return unit;
          }),
        );
      }
      //console.debug(`Writing ${courseId}`, JSON.stringify(courseFile));
      await writeSourceFile(ctx, courseId, TYPENAMES.COURSE, courseFile, null, null);
      return courseFile;
    },
  },
};
