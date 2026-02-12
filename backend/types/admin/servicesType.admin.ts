import {ServiceHeroUpdate} from "../serviceHero.type.js";
import {ServiceSettingUpdate} from "../serviceSetting.type.js";
import {ServiceGalleryUpdate} from "../servicesGallery.type.js";

export interface GalleryService extends Pick<ServiceGalleryUpdate, 'title' | 'caption'> {
    galleryId: string
}

export type ServicesTypeAdmin = Partial<{
    hero: ServiceHeroUpdate,
    setting: ServiceSettingUpdate,
    gallery: ServiceGalleryUpdate,
    serviceName: string,
}>

