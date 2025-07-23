import React from 'react';
import { motion } from 'framer-motion';
import { ThemeSwitcher } from './ThemeSwitcher';
import Button from './Button';
import Input from './Input';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Sun, Moon, Search, Mail, Settings, User } from '../../utils/icons';

const ThemeDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Design System Demo
            </h1>
            <p className="text-muted-foreground">
              Linear-inspired theme system with dark and light modes
            </p>
          </div>
          <ThemeSwitcher size="lg" />
        </motion.div>

        {/* Theme Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Current Theme</CardTitle>
              <CardDescription>
                This demo showcases the new Linear-inspired design system with automatic theme switching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Colors</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-background border border-border rounded flex items-center justify-center text-xs">
                      Background
                    </div>
                    <div className="h-8 bg-card border border-border rounded flex items-center justify-center text-xs">
                      Card
                    </div>
                    <div className="h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-xs">
                      Primary
                    </div>
                    <div className="h-8 bg-accent text-accent-foreground rounded flex items-center justify-center text-xs">
                      Accent
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Text</h4>
                  <div className="space-y-1">
                    <p className="text-foreground">Primary text</p>
                    <p className="text-muted-foreground">Muted text</p>
                    <p className="text-foreground-secondary">Secondary text</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Buttons Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                Different button variants with hover and focus states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button leftIcon={<Mail size={16} />}>With Icon</Button>
                <Button rightIcon={<Settings size={16} />}>Icon Right</Button>
                <Button isLoading>Loading</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Inputs Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Form inputs with different states and icons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Basic input" />
              <Input 
                label="Input with label" 
                placeholder="Enter your email"
                leftIcon={<Mail size={16} />}
              />
              <Input 
                placeholder="Search..." 
                leftIcon={<Search size={16} />}
                rightIcon={<Settings size={16} />}
              />
              <Input 
                label="Input with error" 
                placeholder="This input has an error"
                error="This field is required"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Cards Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>
                Different card variants and compositions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Default Card</CardTitle>
                    <CardDescription>
                      This is a default card with standard styling
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Card content goes here. This demonstrates the default card variant.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>

                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle>Outlined Card</CardTitle>
                    <CardDescription>
                      This card has a more prominent border
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The outlined variant is useful for secondary content.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button size="sm">Confirm</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Interactive Demo</CardTitle>
              <CardDescription>
                Try switching themes and see how all components adapt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Sun size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Light Mode</span>
                </div>
                <ThemeSwitcher />
                <div className="flex items-center gap-2">
                  <Moon size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dark Mode</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The theme switcher in the top-right corner controls the entire application theme.
                All components automatically adapt to the selected theme.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ThemeDemo; 