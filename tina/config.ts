import { defineConfig } from 'tinacms';

export default defineConfig({
  branch: process.env.GITHUB_BRANCH ?? process.env.HEAD ?? 'main',
  clientId: process.env.TINA_CLIENT_ID ?? '',
  token: process.env.TINA_TOKEN ?? '',

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      {
        name: 'home',
        label: 'Home',
        path: 'src/content',
        match: { include: 'home' },
        format: 'json',
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            name: 'tagline',
            label: 'Tagline',
            type: 'string',
          },
          {
            name: 'headline',
            label: 'Headline',
            type: 'string',
            ui: { component: 'textarea' },
          },
          {
            name: 'desc',
            label: 'Description',
            type: 'string',
            ui: { component: 'textarea' },
          },
          { name: 'heroImage', label: 'Hero Image', type: 'image' },
          { name: 'heroImageAlt', label: 'Hero Image Alt Text', type: 'string' },
        ],
      },
      {
        name: 'about',
        label: 'About',
        path: 'src/content',
        match: { include: 'about' },
        format: 'json',
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { name: 'avatar', label: 'Profile Image', type: 'image' },
          { name: 'avatarAlt', label: 'Profile Image Alt Text', type: 'string' },
          { name: 'name', label: 'Name', type: 'string', required: true },
          { name: 'handle', label: 'Handle', type: 'string' },
          { name: 'location', label: 'Location', type: 'string' },
          { name: 'bio', label: 'Bio', type: 'string', ui: { component: 'textarea' } },
          {
            name: 'links',
            label: 'Links',
            type: 'object',
            list: true,
            ui: { itemProps: item => ({ label: item.label }) },
            fields: [
              { name: 'label', label: 'Label', type: 'string' },
              { name: 'url', label: 'URL', type: 'string' },
            ],
          },
        ],
      },
      {
        name: 'posts',
        label: 'Posts',
        path: 'src/content/posts',
        format: 'md',
        defaultItem: () => ({
          date: new Date().toISOString().split('T')[0],
          draft: true,
        }),
        ui: {
          filename: {
            slugify: values => values.title
              ? values.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              : 'untitled',
          },
        },
        fields: [
          {
            name: 'title',
            label: 'Title',
            type: 'string',
            isTitle: true,
            required: true,
          },
          {
            name: 'date',
            label: 'Date',
            type: 'datetime',
            required: true,
            ui: {
              dateFormat: 'YYYY-MM-DD',
            },
          },
          {
            name: 'excerpt',
            label: 'Excerpt',
            type: 'string',
            ui: {
              component: 'textarea',
            },
          },
          {
            name: 'tag',
            label: 'Tags',
            type: 'string',
            list: true,
          },
          {
            name: 'readTime',
            label: 'Read Time',
            type: 'string',
          },
          {
            name: 'image',
            label: 'Image',
            type: 'image',
          },
          {
            name: 'featured',
            label: 'Featured',
            type: 'boolean',
          },
          {
            name: 'draft',
            label: 'Draft',
            type: 'boolean',
          },
          {
            name: 'blueskyUrl',
            label: 'Bluesky URL',
            type: 'string',
          },
          {
            name: 'mastodonUrl',
            label: 'Mastodon URL',
            type: 'string',
          },
          {
            name: 'currentMusic',
            label: 'Current Music',
            type: 'string',
          },
          {
            name: 'currentMood',
            label: 'Current Mood',
            type: 'string',
          },
          {
            name: 'body',
            label: 'Body',
            type: 'rich-text',
            isBody: true,
          },
        ],
      },
      {
        name: 'photos',
        label: 'Photos',
        path: 'src/content/photos',
        format: 'md',
        defaultItem: () => ({
          date: new Date().toISOString().split('T')[0],
          draft: true,
        }),
        ui: {
          filename: {
            slugify: values => values.title
              ? values.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              : 'untitled',
          },
        },
        fields: [
          { name: 'title', label: 'Title', type: 'string', isTitle: true, required: true },
          { name: 'image', label: 'Image', type: 'image', required: true },
          { name: 'alt', label: 'Alt Text', type: 'string', required: true },
          {
            name: 'date',
            label: 'Date',
            type: 'datetime',
            required: true,
            ui: { dateFormat: 'YYYY-MM-DD' },
          },
          { name: 'location', label: 'Location', type: 'string' },
          { name: 'tags', label: 'Tags', type: 'string', list: true },
          { name: 'draft', label: 'Draft', type: 'boolean' },
          { name: 'body', label: 'Caption', type: 'rich-text', isBody: true },
        ],
      },
    ],
  },
});
