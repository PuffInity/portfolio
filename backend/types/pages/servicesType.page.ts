import {ServiceHeroEntity} from "../serviceHero.type.js";
import {ServiceSettingEntity} from "../serviceSetting.type.js";
import {ServiceGalleryEntity} from "../servicesGallery.type.js";
import {ContactEntity} from "../contact.type.js";
import {ServiceFaqEntity} from "../serviceFaq.type.js";


interface Main extends Omit<ServiceHeroEntity, 'serviceId' | 'id' | 'createdAt' | 'updatedAt'> {}
interface Settings extends Omit<ServiceSettingEntity, 'id' | 'serviceId' | 'contactId' | 'createdAt' | 'updatedAt'> {}
interface Gallery extends Omit<ServiceGalleryEntity, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'> {}
interface Contacts extends Omit<ContactEntity, 'id' | 'updatedAt' | 'createdAt'> {}
interface Faq extends Omit<ServiceFaqEntity, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'> {}



export interface ServicesPageContent {
    hero: Main,
    options: Settings,
    gallery: Gallery[],
    contact: Contacts,
    faq: Faq[]
}