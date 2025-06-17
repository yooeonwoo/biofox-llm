#!/usr/bin/env node

// Quick script to check user's mem0 status in database
// Run with: node check_mem0_status.js

const { PrismaClient } = require('./server/node_modules/@prisma/client');

async function checkMem0Status() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:./server/storage/anythingllm.db`
      }
    }
  });

  try {
    console.log('🔍 Checking user mem0 status...');
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        enable_mem0: true,
        createdAt: true
      }
    });

    console.log('\n📊 User Status Report:');
    console.log('=====================');
    
    users.forEach(user => {
      console.log(`User ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Enable Mem0: ${user.enable_mem0 ? '✅ TRUE' : '❌ FALSE'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('-------------------');
    });

    console.log(`\n💡 Total users: ${users.length}`);
    console.log(`💡 Users with mem0 enabled: ${users.filter(u => u.enable_mem0).length}`);

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMem0Status();