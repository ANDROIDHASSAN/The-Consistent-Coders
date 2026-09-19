import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import profileRoutes from '../modules/profile/profile.routes.js';
import jobRoutes from '../modules/jobs/job.routes.js';
import pointsRoutes from '../modules/points/points.routes.js';
import contactRoutes from '../modules/contact/contact.routes.js';
import seoRoutes from '../modules/seo/seo.routes.js';
import learnRoutes from '../modules/learn/learn.routes.js';
import projectRoutes from '../modules/projects/projects.routes.js';
import missionRoutes from '../modules/missions/missions.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/profile', profileRoutes);
router.use('/jobs', jobRoutes);
router.use('/points', pointsRoutes);
router.use('/contact', contactRoutes);
router.use('/seo', seoRoutes);
router.use('/learn', learnRoutes);
router.use('/projects', projectRoutes);
router.use('/missions', missionRoutes);

export default router;
