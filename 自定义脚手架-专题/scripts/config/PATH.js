import path from 'path';

const projectPath = process.env.NODE_BUILD_PATH;

console.log('projectPath', projectPath);
const root = path.resolve(__dirname, '../../');

export { projectPath, root };

