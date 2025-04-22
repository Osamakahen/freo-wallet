'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Alice', role: 'DeFi Trader', text: 'Best wallet I\'ve used!', rating: 5 },
  { name: 'Bob', role: 'NFT Collector', text: 'Super smooth experience', rating: 5 },
  { name: 'Charlie', role: 'Developer', text: 'Great for dApp integration', rating: 5 }
];

export function SocialProof() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center text-[#00FF88] mb-16 font-satoshi"
        >
          What Users Say
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/60 backdrop-blur-xl border border-[#FFD700] p-8 rounded-xl"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#FFD700]" />
                ))}
              </div>
              <p className="text-white/80 mb-4">{testimonial.text}</p>
              <div>
                <p className="font-bold text-[#00FF88]">{testimonial.name}</p>
                <p className="text-sm text-white/60">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 