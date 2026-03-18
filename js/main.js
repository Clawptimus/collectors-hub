// The Collector's Archive - Main JavaScript
// Scoped module pattern to avoid global namespace pollution

(function() {
    'use strict';
    
    // Cache DOM elements
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const viewBtns = document.querySelectorAll('.view-btn');
    const articlesGrid = document.getElementById('articles-grid');
    const topicFilter = document.getElementById('topic-filter');
    const articleCards = document.querySelectorAll('.article-card');
    const activeFiltersContainer = document.getElementById('active-filters');
    const searchInput = document.getElementById('article-search');
    
    // Topic name mapping
    const topicNames = {
        'cameras': 'Vintage Cameras',
        'telephones': 'Antique Telephones',
        'typewriters': 'Typewriters',
        'clocks': 'Antique Clocks',
        'gaming': 'Retro Gaming',
        'pens': 'Vintage Pens',
        'toys': 'Antique Toys',
        'tools': 'Vintage Tools'
    };
    
    document.addEventListener('DOMContentLoaded', function() {
        initNavigation();
        initViewToggle();
        initSearch();
        initSmoothScroll();
        initNavbarScroll();
        initFadeInAnimations();
    });
    
    // Mobile Navigation Toggle
    function initNavigation() {
        if (!navToggle || !navMenu) return;
        
        navToggle.addEventListener('click', function() {
            const isExpanded = navMenu.classList.toggle('active');
            
            // Update ARIA attributes
            navToggle.setAttribute('aria-expanded', isExpanded);
            
            // Animate hamburger to X
            const spans = navToggle.querySelectorAll('span');
            if (isExpanded) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
                
                // Focus first nav item for accessibility
                const firstNavLink = navMenu.querySelector('a');
                if (firstNavLink) {
                    setTimeout(() => firstNavLink.focus(), 100);
                }
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
                
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
    
    // View Toggle (Grid/List)
    function initViewToggle() {
        if (!viewBtns.length || !articlesGrid) return;
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class and aria-pressed from all buttons
                viewBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                
                // Add active class and aria-pressed to clicked button
                this.classList.add('active');
                this.setAttribute('aria-pressed', 'true');
                
                // Toggle view
                const view = this.dataset.view;
                if (view === 'list') {
                    articlesGrid.classList.add('list-view');
                } else {
                    articlesGrid.classList.remove('list-view');
                }
                
                // Save preference
                localStorage.setItem('articleView', view);
            });
        });
        
        // Restore saved view preference
        const savedView = localStorage.getItem('articleView');
        if (savedView) {
            const savedBtn = document.querySelector(`.view-btn[data-view="${savedView}"]`);
            if (savedBtn) {
                savedBtn.click();
            }
        }
    }
    
    // Topic Filter
    function initTopicFilter() {
        if (!topicFilter || !articleCards.length) return;
        
        topicFilter.addEventListener('change', function() {
            const selectedTopic = this.value;
            filterArticles(selectedTopic);
            updateActiveFilters(selectedTopic);
            updateURL(selectedTopic);
        });
        
        // Check for URL parameter on load
        const urlParams = new URLSearchParams(window.location.search);
        const topicParam = urlParams.get('topic');
        if (topicParam && topicNames[topicParam]) {
            topicFilter.value = topicParam;
            filterArticles(topicParam);
            updateActiveFilters(topicParam);
        }
    }
    
    function filterArticles(topic) {
        articleCards.forEach(card => {
            if (!topic || card.dataset.topic === topic) {
                card.style.display = '';
                // Add fade-in animation
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    function updateActiveFilters(topic) {
        if (!activeFiltersContainer) return;
        
        if (!topic) {
            activeFiltersContainer.innerHTML = '';
            return;
        }
        
        activeFiltersContainer.innerHTML = `
            <span class="active-filter">
                ${topicNames[topic] || topic}
                <button class="clear-filter-btn" aria-label="Remove ${topicNames[topic] || topic} filter">×</button>
            </span>
        `;
        
        // Add click handler for the clear button
        const clearBtn = activeFiltersContainer.querySelector('.clear-filter-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearFilter);
        }
    }
    
    function updateURL(topic) {
        if (!window.history.replaceState) return;
        
        const url = new URL(window.location);
        if (topic) {
            url.searchParams.set('topic', topic);
        } else {
            url.searchParams.delete('topic');
        }
        window.history.replaceState({}, document.title, url);
    }
    
    // Search functionality
    function initSearch() {
        if (!searchInput || !articleCards.length) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.toLowerCase().trim();
                searchArticles(searchTerm);
            }, 300);
        });
        
        // Also trigger search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.toLowerCase().trim();
                searchArticles(searchTerm);
            }
        });
    }
    
    function searchArticles(term) {
        articleCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const excerpt = card.querySelector('p').textContent.toLowerCase();
            const topic = card.dataset.topic ? card.dataset.topic.toLowerCase() : '';
            
            if (!term || title.includes(term) || excerpt.includes(term) || topic.includes(term)) {
                card.style.display = '';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.3s ease';
                    card.style.opacity = '1';
                }, 50);
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Smooth scroll for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update focus for accessibility
                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus({ preventScroll: true });
                }
            });
        });
    }
    
    // Add scroll-based navbar styling
    function initNavbarScroll() {
        let lastScroll = 0;
        const nav = document.querySelector('.site-nav');
        
        if (!nav) return;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            } else {
                nav.style.boxShadow = 'none';
            }
            
            lastScroll = currentScroll;
        });
    }
    
    // Intersection Observer for fade-in animations
    function initFadeInAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe cards and sections
        document.querySelectorAll('.article-card, .topic-card, .value-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }
    
    // Clear filter function - scoped inside module
    function clearFilter() {
        if (topicFilter) {
            topicFilter.value = '';
        }
        
        if (activeFiltersContainer) {
            activeFiltersContainer.innerHTML = '';
        }
        
        articleCards.forEach(card => {
            card.style.display = '';
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 50);
        });
        
        // Update URL
        updateURL('');
    }
    
})();
