import path from 'path';
import fs from 'fs';
import { root, projectPath } from './config/PATH';

let isDEV = process.env.NODE_ENV !== 'production';

module.exports = function(processor) {
  // This will allow to use this <!-- build:customBlock[:target] <value> --> syntax
  processor.registerBlockType('chip', function(content, block, blockLine, blockContent) {
    if (isDEV) {
      let title = fs.readFileSync(path.join(root, block.asset), { encoding: 'utf-8' });
      let result = content.replace(blockLine, title);
      return result;
    }
    let title = `{pc:block pos="${block.asset}"}{/pc}`;
    let result = content.replace(blockLine, title);
    return result;
  });
  processor.registerBlockType('autoChip', function(content, block, blockLine, blockContent) {
    if (isDEV) {
      let title = fs.readFileSync(path.join(root, block.asset), { encoding: 'utf-8' });
      let result = content.replace(blockLine, title);
      return result;
    }
    let title = `{pc:block pos="${block.asset}" siteid="50"}{/pc}`;
    let result = content.replace(blockLine, title);
    return result;
  });
};
