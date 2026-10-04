import React from 'react';
import { MessageCircle, Camera, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-24 pt-12 pb-8 border-t border-border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Soundwave</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">
            The next generation of music streaming. Premium sound, beautiful design, endless discovery.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="flex flex-col gap-2 text-text-secondary text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Jobs</a></li>
            <li><a href="#" className="hover:text-white transition-colors">For the Record</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Communities</h4>
          <ul className="flex flex-col gap-2 text-text-secondary text-sm">
            <li><a href="#" className="hover:text-white transition-colors">For Artists</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Developers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Advertising</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Investors</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Social</h4>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:text-white hover:bg-surface-light transition-all shadow-md">
              <MessageCircle size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:text-white hover:bg-surface-light transition-all shadow-md">
              <Camera size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:text-white hover:bg-surface-light transition-all shadow-md">
              <Globe size={18} />
            </a>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-text-secondary">
        <ul className="flex flex-wrap gap-4 mb-4 md:mb-0">
          <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Privacy Center</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
          <li><a href="#" className="hover:text-white transition-colors">About Ads</a></li>
        </ul>
        <p>&copy; 2026 Soundwave AB</p>
      </div>
    </footer>
  );
}
