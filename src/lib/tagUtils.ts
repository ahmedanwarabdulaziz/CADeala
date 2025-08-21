import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface TagCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  applicableLevels: CategoryLevel[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryLevel = 'industry' | 'businessType' | 'serviceCategory' | 'productCategory';

// Predefined tag categories
export const PREDEFINED_TAG_CATEGORIES = [
  {
    name: 'Location',
    slug: 'location',
    description: 'Geographic and area-based tags',
    color: '#3B82F6',
    icon: 'map-pin',
    sortOrder: 1,
    active: true
  },
  {
    name: 'Demographics',
    slug: 'demographics',
    description: 'Target audience and customer segments',
    color: '#10B981',
    icon: 'users',
    sortOrder: 2,
    active: true
  },
  {
    name: 'Seasonal',
    slug: 'seasonal',
    description: 'Time-based and seasonal offerings',
    color: '#F59E0B',
    icon: 'calendar',
    sortOrder: 3,
    active: true
  },
  {
    name: 'Features',
    slug: 'features',
    description: 'Special features and amenities',
    color: '#8B5CF6',
    icon: 'star',
    sortOrder: 4,
    active: true
  },
  {
    name: 'Style & Cuisine',
    slug: 'style-cuisine',
    description: 'Style, cuisine, and aesthetic preferences',
    color: '#EF4444',
    icon: 'palette',
    sortOrder: 5,
    active: true
  },
  {
    name: 'Price Range',
    slug: 'price-range',
    description: 'Price categories and affordability',
    color: '#6B7280',
    icon: 'dollar-sign',
    sortOrder: 6,
    active: true
  }
];

// Predefined tags organized by category
export const PREDEFINED_TAGS = {
  'Location': [
    { name: 'Downtown Toronto', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'North York', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Mississauga', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Scarborough', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Etobicoke', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Markham', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Richmond Hill', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Vaughan', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Oakville', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Burlington', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] }
  ],
  'Demographics': [
    { name: 'Family-friendly', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Luxury', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Budget-friendly', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Student-friendly', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Senior-friendly', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Corporate', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Romantic', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Kid-friendly', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] }
  ],
  'Seasonal': [
    { name: 'Summer', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Winter', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Spring', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Fall', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Holiday', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Year-round', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Weekend Special', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Happy Hour', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] }
  ],
  'Features': [
    { name: 'Wheelchair Accessible', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Pet-friendly', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: '24/7', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Free WiFi', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Parking Available', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Delivery', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Takeout', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Reservations', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Outdoor Seating', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Live Music', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] }
  ],
  'Style & Cuisine': [
    { name: 'Italian', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Chinese', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Japanese', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Indian', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Mexican', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Thai', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Modern', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Traditional', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Casual', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Fine Dining', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Fast Casual', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Vegan', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Vegetarian', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] },
    { name: 'Gluten-free', applicableLevels: ['businessType', 'serviceCategory', 'productCategory'] }
  ],
  'Price Range': [
    { name: '$', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: '$$', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: '$$$', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] },
    { name: '$$$$', applicableLevels: ['industry', 'businessType', 'serviceCategory', 'productCategory'] }
  ]
};

// Generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Populate tag categories
export const populateTagCategories = async (): Promise<{ [key: string]: string }> => {
  const categoryIds: { [key: string]: string } = {};
  
  for (const category of PREDEFINED_TAG_CATEGORIES) {
    const docRef = await addDoc(collection(db, 'tagCategories'), {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    categoryIds[category.name] = docRef.id;
  }
  
  return categoryIds;
};

// Populate tags
export const populateTags = async (categoryIds: { [key: string]: string }): Promise<void> => {
  for (const [categoryName, tags] of Object.entries(PREDEFINED_TAGS)) {
    const categoryId = categoryIds[categoryName];
    if (!categoryId) continue;
    
    for (const tag of tags) {
      await addDoc(collection(db, 'tags'), {
        name: tag.name,
        slug: generateSlug(tag.name),
        categoryId: categoryId,
        applicableLevels: tag.applicableLevels,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
};

// Check if tag system is empty
export const isTagSystemEmpty = async (): Promise<boolean> => {
  const [categoriesSnapshot, tagsSnapshot] = await Promise.all([
    getDocs(collection(db, 'tagCategories')),
    getDocs(collection(db, 'tags'))
  ]);
  
  return categoriesSnapshot.empty && tagsSnapshot.empty;
};

// Populate entire tag system
export const populateTagSystem = async (): Promise<void> => {
  try {
    // Check if system is already populated
    const isEmpty = await isTagSystemEmpty();
    if (!isEmpty) {
      throw new Error('Tag system is already populated');
    }
    
    // Populate categories first
    const categoryIds = await populateTagCategories();
    
    // Then populate tags
    await populateTags(categoryIds);
    
    console.log('Tag system populated successfully!');
  } catch (error) {
    console.error('Error populating tag system:', error);
    throw error;
  }
};
