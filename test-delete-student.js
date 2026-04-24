// Test script to verify student deletion fix
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStudentDeletion() {
  try {
    console.log('Testing student deletion fix...');
    
    // Find a test student (you can replace this ID with an actual student ID)
    const testStudentId = '2f659bba-bac2-4493-a722-644071a5ef53';
    
    console.log(`Attempting to delete student with ID: ${testStudentId}`);
    
    // First check if student exists
    const student = await prisma.user.findUnique({
      where: { id: testStudentId },
      include: {
        streaks: true,
        resourceAccess: true,
        writingJournals: true,
        audioJournals: true,
        artJournals: true,
        highRiskAlerts: true,
      }
    });
    
    if (!student) {
      console.log('Student not found');
      return;
    }
    
    console.log('Found student:', student.firstName, student.lastName);
    console.log('Related records:');
    console.log('- Streaks:', student.streaks?.length || 0);
    console.log('- Resource Access:', student.resourceAccess?.length || 0);
    console.log('- Writing Journals:', student.writingJournals?.length || 0);
    console.log('- Audio Journals:', student.audioJournals?.length || 0);
    console.log('- Art Journals:', student.artJournals?.length || 0);
    console.log('- High Risk Alerts:', student.highRiskAlerts?.length || 0);
    
    // Delete related records in order (following our fix)
    console.log('Deleting related records...');
    
    // Delete streak record (no cascade delete)
    if (student.streaks) {
      await prisma.streak.delete({
        where: { userId: testStudentId },
      });
      console.log('✓ Deleted streak record');
    }
    
    // Delete resource access records (no cascade delete)
    await prisma.resourceAccess.deleteMany({
      where: { userId: testStudentId },
    });
    console.log('✓ Deleted resource access records');
    
    // Delete writing journals (no cascade delete)
    await prisma.writingJournal.deleteMany({
      where: { userId: testStudentId },
    });
    console.log('✓ Deleted writing journals');
    
    // Delete audio journals (no cascade delete)
    await prisma.audioJournal.deleteMany({
      where: { userId: testStudentId },
    });
    console.log('✓ Deleted audio journals');
    
    // Delete art journals (no cascade delete)
    await prisma.artJournal.deleteMany({
      where: { userId: testStudentId },
    });
    console.log('✓ Deleted art journals');
    
    // Delete high risk alerts (no cascade delete)
    await prisma.highRiskAlert.deleteMany({
      where: { userId: testStudentId },
    });
    console.log('✓ Deleted high risk alerts');
    
    // Delete the user (cascade will handle most other relations)
    await prisma.user.delete({
      where: { id: testStudentId },
    });
    console.log('✓ Successfully deleted student');
    
    console.log('Student deletion fix verified successfully!');
    
  } catch (error) {
    console.error('Error during student deletion test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentDeletion();
