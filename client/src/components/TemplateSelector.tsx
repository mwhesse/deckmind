import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Code as CodeIcon,
  Web as WebIcon,
  Storage as StorageIcon,
  PhoneAndroid as MobileIcon,
  Build as BuildIcon,
  Science as ScienceIcon,
  CheckCircle as CheckIcon,
  Schedule as TimeIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
}

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Frontend':
      return <WebIcon />;
    case 'Backend':
      return <StorageIcon />;
    case 'Full-Stack':
      return <CodeIcon />;
    case 'Mobile':
      return <MobileIcon />;
    case 'DevOps':
      return <BuildIcon />;
    case 'Data Science':
      return <ScienceIcon />;
    case 'Quality Assurance':
      return <CheckIcon />;
    default:
      return <CodeIcon />;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return 'success';
    case 'Intermediate':
      return 'warning';
    case 'Advanced':
      return 'error';
    default:
      return 'default';
  }
};

const TemplateCard: React.FC<{
  template: Template;
  onSelect: (template: Template) => void;
}> = ({ template, onSelect }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
      onClick={() => onSelect(template)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {getCategoryIcon(template.category)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {template.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={template.category}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={template.difficulty}
                size="small"
                color={getDifficultyColor(template.difficulty) as any}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TimeIcon sx={{ mr: 1, fontSize: 16 }} />
          <Typography variant="body2" color="text.secondary">
            {template.estimatedTime}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {template.tags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
          {template.tags.length > 3 && (
            <Chip
              label={`+${template.tags.length - 3}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" color="primary" fullWidth>
          Use Template
        </Button>
      </CardActions>
    </Card>
  );
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  open,
  onClose,
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Popular');

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let url = '/api/templates';
      const params = new URLSearchParams();

      if (selectedCategory !== 'Popular') {
        if (selectedCategory === 'All') {
          // No category filter
        } else {
          params.append('category', selectedCategory);
        }
      } else {
        params.append('popular', 'true');
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setTemplates(response.data.templates);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const categoryTabs = ['Popular', 'All', ...categories];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Choose a Template
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a template to get started with your development task
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search templates..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {categoryTabs.map((category) => (
              <Tab
                key={category}
                label={category}
                value={category}
                icon={category !== 'Popular' && category !== 'All' ? getCategoryIcon(category) : undefined}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading templates...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <TemplateCard
                  template={template}
                  onSelect={handleSelectTemplate}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && templates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No templates found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or category filter
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelector;