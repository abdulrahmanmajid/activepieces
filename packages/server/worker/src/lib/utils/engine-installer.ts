import { PathLike } from 'fs'
import { copyFile, rename, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { logger, memoryLock, SharedSystemProp, system } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { cacheHandler } from './cache-handler'

const engineExecutablePath = system.getOrThrow(
    SharedSystemProp.ENGINE_EXECUTABLE_PATH,
)
const isDev = system.getOrThrow(SharedSystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT
const ENGINE_CACHE_ID = nanoid()
const ENGINE_INSTALLED = 'ENGINE_INSTALLED'

/**
 * Installs the engine executable to the given path
 */
export const engineInstaller = {
    async install({ path }: InstallParams): Promise<void> {
        const lock = await memoryLock.acquire(`engineInstaller#${path}`)
        try {
            logger.debug({ path }, '[engineInstaller#install]')
            const cache = cacheHandler(path) 
            const isEngineInstalled = await cache.cacheCheckState(ENGINE_INSTALLED) === ENGINE_CACHE_ID
            if (!isEngineInstalled || isDev) {
                await atomicCopy(engineExecutablePath, `${path}/main.js`) 
            }
            if (!isEngineInstalled || isDev) {
                await atomicCopy(`${engineExecutablePath}.map`, `${path}/main.js.map`)
            }
            await cache.setCache(ENGINE_INSTALLED, ENGINE_CACHE_ID)
        }
        finally {
            await lock.release()
        }
    },
}

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const srcDir = dirname(src.toString())
    const tempPath = join(srcDir, 'engine.temp.js')
    try {
        await copyFile(src, tempPath)
        await rename(tempPath, dest)
    }
    catch (error: unknown) {
        throw error
    }
}

type InstallParams = {
    path: string
}
