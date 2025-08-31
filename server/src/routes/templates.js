import express from 'express';
import {
  AGENT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  getPopularTemplates
} from '../templates.js';

const router = express.Router();

// Get all templates
router.get('/', (req, res) => {
  try {
    const { category, search, popular } = req.query;

    let templates;

    if (popular === 'true') {
      templates = getPopularTemplates();
    } else if (category) {
      templates = getTemplatesByCategory(category);
    } else if (search) {
      templates = searchTemplates(search);
    } else {
      templates = Object.entries(AGENT_TEMPLATES).map(([id, template]) => ({
        id,
        ...template
      }));
    }

    res.json({
      templates,
      total: templates.length,
      categories: TEMPLATE_CATEGORIES
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Get template categories
router.get('/categories/list', (req, res) => {
  try {
    res.json({
      categories: TEMPLATE_CATEGORIES,
      total: TEMPLATE_CATEGORIES.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get templates by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const templates = getTemplatesByCategory(category);

    res.json({
      templates,
      category,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates by category' });
  }
});

// Search templates
router.get('/search/:query', (req, res) => {
  try {
    const { query } = req.params;
    const templates = searchTemplates(query);

    res.json({
      templates,
      query,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search templates' });
  }
});

export default router;