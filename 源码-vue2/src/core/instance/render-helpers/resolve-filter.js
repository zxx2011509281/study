/* @flow */

import { identity, resolveAsset } from 'core/util/index'

/**
 * Runtime helper for resolving filters
 */
// export const identity = (_: any) => _
export function resolveFilter(id: string): Function {
    return resolveAsset(this.$options, 'filters', id, true) || identity
}