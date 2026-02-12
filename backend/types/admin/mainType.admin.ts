import {ServicesUpdate} from "../services.type.js";
import {PricingPlansUpdate} from "../pricingPlans.type.js";
import {MainPageUpdate} from "../mainPage.type.js";
import {AboutMeUpdate} from "../aboutMe.type.js";


export type MainTypeAdmin  = Partial<{
    service: ServicesUpdate,
    price: PricingPlansUpdate,
    main: MainPageUpdate,
    aboutMe: AboutMeUpdate,
    selectedServiceName: string,
    selectedPricingTitle: string,
}>