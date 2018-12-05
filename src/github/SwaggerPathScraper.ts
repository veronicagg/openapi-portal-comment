export interface PartialSwagger {
  serviceName: string
  serviceType: ServiceType
  rpName: string
  releaseState: ReleaseState
  version: string
  configPath: string
}

/**
 * Confidentiality of a swagger
 *
 * @export
 * @enum {number}
 */
export enum ServiceType {
  ResourceManager = 'resource-manager',
  ControlPlane = 'control-plane',
  DataPlane = 'data-plane'
}

/**
 * Stability of a swagger
 *
 * @export
 * @enum {number}
 */
export enum ReleaseState {
  Preview = 'preview',
  Stable = 'stable'
}

export class SwaggerPathScraper {
  private regexStrategies = {
    // eg specification/batch/data-plane/Microsoft.Batch/stable/2015-12-01.2.2/
    dateSemvar: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/(stable|preview)/([0-9]{4}-[0-9]{2}-[0-9]{2}[0-9.]+)/'
    ),
    // eg specification/batch/data-plane/Microsoft.Batch/2017-09-01.6.0/
    dateSemvarWithoutReleaseState: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/([0-9.-]+)/'
    ),
    // eg specification/advisor/resource-manager/Microsoft.Advisor/preview/2016-07-12-preview/
    dateWithReleaseState: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/(stable|preview)/([0-9]{4}-[0-9]{2}-[0-9]{2})(-beta|-stable|-preview|-privatepreview)/'
    ),
    // eg specification/azsadmin/resource-manager/commerce/Microsoft.Commerce.Admin/preview/2015-06-01-preview/
    dateWithReleaseStateAndExtraFolder: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/([^/]*)/(stable|preview)/([0-9]{4}-[0-9]{2}-[0-9]{2})(-beta|-stable|-preview|-privatepreview)/'
    ),
    // Eg: specification/addons/resource-manager/Microsoft.Addons/preview/2017-05-15/
    regularDate: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/(stable|preview)/([0-9]{4}-[0-9]{2}-[0-9]{2})/'
    ),
    // eg specification/azsadmin/resource-manager/azurebridge/Microsoft.AzureBridge.Admin/preview/2016-01-01/
    regularDateAndExtraFolder: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/([^/]*)/(stable|preview)/([0-9]{4}-[0-9]{2}-[0-9]{2})/'
    ),
    // eg specification/servicefabric/data-plane/Microsoft.ServiceFabric/stable/6.3/
    semvar: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/(stable|preview)/([0-9.vV]+)/'
    ),
    // eg specification/cognitiveservices/data-plane/LUIS/Runtime/stable/v2.0/
    semvarWithExtraFolder: new RegExp(
      'specification/([^/]*)/(resource-manager|data-plane|control-plane)/([^/]*)/([^/]*)/(stable|preview)/([0-9.vV]+)/'
    ),
    // eg specification/cognitiveservices/data-plane/ComputerVision/stable/v1.0/
    semvarWithoutReleaseState: new RegExp(
      'specification/([^/]*)/(resource-management|resource-manager|data-plane|control-plane)/([^/]*)/([0-9.v])*/'
    )
  }

  private parsers = {
    regularDate: (path: string) => {
      const matches = this.regexStrategies.regularDate.exec(path)

      if (!matches) {
        throw 0
      }

      const [configPath, serviceName, serviceType, rpName, releaseState, version] = matches

      return {
        configPath,
        releaseState: releaseState.toLowerCase() as ReleaseState,
        rpName,
        serviceName,
        serviceType: serviceType.toLowerCase() as ServiceType,
        version
      }
    },

    dateWithReleaseState: (path: string) => {
      const matches = this.regexStrategies.dateWithReleaseState.exec(path)

      if (!matches) {
        throw 0
      }

      const [
        configPath,
        serviceName,
        serviceType,
        rpName,
        releaseState,
        version,
        dashReleaseState
      ] = matches

      return {
        configPath,
        releaseState: releaseState.toLowerCase() as ReleaseState,
        rpName,
        serviceName,
        serviceType: serviceType.toLowerCase() as ServiceType,
        version: version + dashReleaseState
      }
    },

    dateSemvar: (path: string) => {
      const matches = this.regexStrategies.dateSemvar.exec(path)

      if (!matches) {
        throw 0
      }

      const [configPath, serviceName, serviceType, rpName, releaseState, version] = matches

      return {
        configPath,
        releaseState: releaseState.toLowerCase() as ReleaseState,
        rpName,
        serviceName,
        serviceType: serviceType.toLowerCase() as ServiceType,
        version
      }
    },

    dateSemvarWithoutReleaseState: () => {
      return undefined
    },

    dateWithReleaseStateAndExtraFolder: () => {
      return undefined
    },

    regularDateAndExtraFolder: () => {
      return undefined
    },

    semvar: (path: string) => {
      const matches = this.regexStrategies.semvar.exec(path)

      if (!matches) {
        throw 0
      }

      const [configPath, serviceName, serviceType, rpName, releaseState, version] = matches

      return {
        configPath,
        releaseState: releaseState.toLowerCase() as ReleaseState,
        rpName,
        serviceName,
        serviceType: serviceType.toLowerCase() as ServiceType,
        version
      }
    },

    semvarWithoutReleaseState: () => {
      return undefined
    },

    semvarWithExtraFolder: (path: string) => {
      const matches = this.regexStrategies.semvarWithExtraFolder.exec(path)

      if (!matches) {
        throw 0
      }

      const [
        configPath,
        serviceName,
        serviceType,
        rpName,
        extraFolder,
        releaseState,
        version
      ] = matches

      return {
        configPath,
        releaseState: releaseState.toLowerCase() as ReleaseState,
        rpName: `${rpName}${extraFolder}`,
        serviceName,
        serviceType: serviceType.toLowerCase() as ServiceType,
        version
      }
    }
  }

  public parsePathToSwagger = (path: string): PartialSwagger | undefined => {
    if (this.regexStrategies.regularDate.test(path)) {
      return this.parsers.regularDate(path)
    }
    if (this.regexStrategies.dateWithReleaseState.test(path)) {
      return this.parsers.dateWithReleaseState(path)
    }
    if (this.regexStrategies.dateSemvar.test(path)) {
      return this.parsers.dateSemvar(path)
    }
    if (this.regexStrategies.dateSemvarWithoutReleaseState.test(path)) {
      return this.parsers.dateSemvarWithoutReleaseState()
    }
    if (this.regexStrategies.dateWithReleaseStateAndExtraFolder.test(path)) {
      return this.parsers.dateWithReleaseStateAndExtraFolder()
    }
    if (this.regexStrategies.regularDateAndExtraFolder.test(path)) {
      return this.parsers.regularDateAndExtraFolder()
    }
    if (this.regexStrategies.semvar.test(path)) {
      return this.parsers.semvar(path)
    }
    if (this.regexStrategies.semvarWithoutReleaseState.test(path)) {
      return this.parsers.semvarWithoutReleaseState()
    }
    if (this.regexStrategies.semvarWithExtraFolder.test(path)) {
      return this.parsers.semvarWithExtraFolder(path)
    }

    return undefined
  }

  public normaliseSwaggerPaths = (paths: string[]) => {
    return [...new Set(paths.filter(this.pathIsSwagger).map(this.swaggerBase))]
  }

  private pathIsSwagger = (path: string) => {
    for (const regex of Object.values(this.regexStrategies)) {
      if (regex.test(path)) {
        return true
      }
    }
    return false
  }

  private swaggerBase = (path: string) => {
    for (const regex of Object.values(this.regexStrategies)) {
      const match = regex.exec(path)
      if (match !== null) {
        return match[0]
      }
    }
    return undefined
  }
}
