import {MainPageEntity} from "../mainPage.type.js";
import {ServicesEntity} from "../services.type.js";
import {PricingPlansEntity} from "../pricingPlans.type.js";
import {TestimonialsEntity} from '../testimonials.type.js'
import {ContactEntity} from '../contact.type.js';
import {AboutMeEntity} from "../aboutMe.type.js";
import {AvatarTestimonialsEntity} from "../avatarTestimonials.type.js";

interface Main extends Pick<MainPageEntity, 'title' | 'subtitle' | 'btnText1' | 'btnHref1' | 'btnText2' | 'btnHref2' | 'image' | 'bullets'> {}
interface Services extends Omit<ServicesEntity, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> {}
interface Pricing extends Omit<PricingPlansEntity, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt'> {}
interface Testimonials extends Omit<TestimonialsEntity, 'id' | 'sortOrder' | 'updatedAt' | 'createdAt' | 'serviceId'> {}
interface Contact extends Omit<ContactEntity, 'id' | 'updatedAt' | 'createdAt'> {}
interface AboutMe extends Omit<AboutMeEntity, 'id' | 'updatedAt' | 'createdAt'> {}
interface AvatarTestimonials extends Pick<AvatarTestimonialsEntity, 'url' | 'name'> {}

export interface MainPageContent {
    hero: Main,
    services: Services[],
    pricing: Pricing[],
    about: AboutMe,
    testimonials: Testimonials[],
    avatarTestimonials: AvatarTestimonials[],
    contacts: Contact
}
