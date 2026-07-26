import { Router, type IRouter } from "express";
import healthRouter from "./health";
import entriesRouter from "./entries";
import adminRouter from "./admin";
import contentRouter from "./content";
import pagesRouter from "./pages";
import storageRouter from "./storage";
import socialRouter from "./social";
import sponsorRouter from "./sponsor";
import articoliRouter from "./articoli";
import coachingRouter from "./coaching";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(entriesRouter);
router.use(adminRouter);
router.use(contentRouter);
router.use(pagesRouter);
router.use(storageRouter);
router.use(socialRouter);
router.use(sponsorRouter);
router.use(articoliRouter);
router.use(coachingRouter);
router.use(contactRouter);

export default router;
