"""
Comprehensive Test Suite for Shear Wall Implementation

This test suite validates the complete shear wall implementation including:
1. AIDEA model creation with shear walls
2. Translation to PyNite format
3. Analysis execution
4. Results extraction and validation
5. Pier and coupling beam identification
6. Story stiffness calculations
"""

import unittest
import sys
from sample_two_storey_model import create_two_storey_structure
from aidea_to_pynite_translator import AideaToPyniteTranslator
from pynite_results_models import create_shear_wall_results_from_pynite
from aidea_model import ShearWall, ShearWallMaterial, ShearWallOpening, ShearWallStory


class TestShearWallImplementation(unittest.TestCase):
    """Test suite for shear wall implementation."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.aidea_model = create_two_storey_structure()
        self.translator = AideaToPyniteTranslator()
        
    def test_aidea_model_creation(self):
        """Test AIDEA model creation with shear walls."""
        print("\n=== Testing AIDEA Model Creation ===")
        
        # Check that shear walls were created
        self.assertEqual(len(self.aidea_model.shear_walls), 2, "Should have 2 shear walls")
        
        # Check shear wall properties
        sw_x1 = self.aidea_model.shear_walls['SW_X1']
        self.assertEqual(sw_x1.length, 6.0, "SW_X1 length should be 6.0m")
        self.assertEqual(sw_x1.height, 6.0, "SW_X1 height should be 6.0m")
        self.assertEqual(len(sw_x1.materials), 1, "SW_X1 should have 1 material")
        self.assertEqual(len(sw_x1.openings), 1, "SW_X1 should have 1 opening")
        self.assertEqual(len(sw_x1.stories), 2, "SW_X1 should have 2 stories")
        self.assertEqual(len(sw_x1.loads), 2, "SW_X1 should have 2 loads")
        
        sw_y1 = self.aidea_model.shear_walls['SW_Y1']
        self.assertEqual(sw_y1.length, 4.0, "SW_Y1 length should be 4.0m")
        self.assertEqual(sw_y1.height, 6.0, "SW_Y1 height should be 6.0m")
        self.assertEqual(len(sw_y1.openings), 1, "SW_Y1 should have 1 opening")
        
        print("✓ AIDEA model creation test passed")
        
    def test_translation_to_pynite(self):
        """Test translation from AIDEA to PyNite format."""
        print("\n=== Testing Translation to PyNite ===")
        
        # Translate the model
        pynite_model = self.translator.translate_model(self.aidea_model)
        
        # Check that translation was successful
        self.assertIsNotNone(pynite_model, "PyNite model should be created")
        self.assertEqual(len(self.translator.shear_walls), 2, "Should have 2 translated shear walls")
        
        # Check shear wall properties
        for wall_id, wall in self.translator.shear_walls.items():
            self.assertIsNotNone(wall.L, f"Wall {wall_id} should have length")
            self.assertIsNotNone(wall.H, f"Wall {wall_id} should have height")
            self.assertGreater(len(wall._materials), 0, f"Wall {wall_id} should have materials")
            self.assertGreater(len(wall._stories), 0, f"Wall {wall_id} should have stories")
        
        print("✓ Translation to PyNite test passed")
        
    def test_frame_analysis(self):
        """Test frame analysis execution."""
        print("\n=== Testing Frame Analysis ===")
        
        # Translate and analyze
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.run_analysis('linear', log=False, check_statics=False)
        
        # Check that analysis results exist
        load_combos = list(pynite_model.load_combos.keys())
        self.assertGreater(len(load_combos), 0, "Should have load combinations")
        
        # Check node displacements
        for node_name, node in pynite_model.nodes.items():
            for combo in load_combos:
                self.assertIn(combo, node.DX, f"Node {node_name} should have DX for {combo}")
                self.assertIn(combo, node.DY, f"Node {node_name} should have DY for {combo}")
                self.assertIn(combo, node.DZ, f"Node {node_name} should have DZ for {combo}")
        
        print("✓ Frame analysis test passed")
        
    def test_shear_wall_analysis(self):
        """Test shear wall analysis execution."""
        print("\n=== Testing Shear Wall Analysis ===")
        
        # Translate and analyze
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.run_analysis('linear', log=False, check_statics=False)
        self.translator.analyze_shear_walls(log=False, check_statics=False)
        
        # Check that shear walls were analyzed
        for wall_id, wall in self.translator.shear_walls.items():
            self.assertIsNotNone(wall.model, f"Wall {wall_id} should have a model")
            
            # Check that piers were identified
            self.assertGreater(len(wall.piers), 0, f"Wall {wall_id} should have identified piers")
            
            # Check pier properties
            for pier_id, pier in wall.piers.items():
                self.assertGreater(pier.width, 0, f"Pier {pier_id} should have positive width")
                self.assertGreater(pier.height, 0, f"Pier {pier_id} should have positive height")
                self.assertGreaterEqual(pier.x, 0, f"Pier {pier_id} should have non-negative x position")
                self.assertGreaterEqual(pier.y, 0, f"Pier {pier_id} should have non-negative y position")
        
        print("✓ Shear wall analysis test passed")
        
    def test_pier_identification(self):
        """Test automatic pier identification."""
        print("\n=== Testing Pier Identification ===")
        
        # Analyze shear walls
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.analyze_shear_walls(log=False, check_statics=False)
        
        # Check pier identification for SW_X1 (has door opening)
        sw_x1 = self.translator.shear_walls['SW_X1']
        self.assertGreater(len(sw_x1.piers), 1, "SW_X1 should have multiple piers due to opening")
        
        # Check that piers don't overlap with openings
        door_opening = self.aidea_model.shear_walls['SW_X1'].openings[0]
        for pier_id, pier in sw_x1.piers.items():
            # Pier should not be completely inside the door opening
            pier_right = pier.x + pier.width
            pier_top = pier.y + pier.height
            opening_right = door_opening.x_start + door_opening.width
            opening_top = door_opening.y_start + door_opening.height
            
            # Check if pier is completely inside opening (should not happen)
            completely_inside = (pier.x >= door_opening.x_start and 
                               pier_right <= opening_right and
                               pier.y >= door_opening.y_start and 
                               pier_top <= opening_top)
            self.assertFalse(completely_inside, f"Pier {pier_id} should not be inside opening")
        
        print("✓ Pier identification test passed")
        
    def test_coupling_beam_identification(self):
        """Test automatic coupling beam identification."""
        print("\n=== Testing Coupling Beam Identification ===")
        
        # Analyze shear walls
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.analyze_shear_walls(log=False, check_statics=False)
        
        # Check coupling beam identification
        for wall_id, wall in self.translator.shear_walls.items():
            # Should have coupling beams if there are openings
            openings = self.aidea_model.shear_walls[wall_id].openings
            if len(openings) > 0:
                # May have coupling beams above openings
                for beam_id, beam in wall.coupling_beams.items():
                    self.assertGreater(beam.length, 0, f"Beam {beam_id} should have positive length")
                    self.assertGreater(beam.height, 0, f"Beam {beam_id} should have positive height")
        
        print("✓ Coupling beam identification test passed")
        
    def test_story_stiffness_calculation(self):
        """Test story stiffness calculation."""
        print("\n=== Testing Story Stiffness Calculation ===")
        
        # Analyze shear walls
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.analyze_shear_walls(log=False, check_statics=False)
        
        # Check story stiffness calculation
        for wall_id, wall in self.translator.shear_walls.items():
            for story in wall._stories:
                story_name = str(story[0])
                try:
                    stiffness = wall.stiffness(story_name)
                    self.assertGreater(stiffness, 0, f"Story {story_name} stiffness should be positive")
                    self.assertLess(stiffness, 1e6, f"Story {story_name} stiffness should be reasonable")
                except Exception as e:
                    self.fail(f"Failed to calculate stiffness for story {story_name}: {e}")
        
        print("✓ Story stiffness calculation test passed")
        
    def test_results_extraction(self):
        """Test results extraction and validation."""
        print("\n=== Testing Results Extraction ===")
        
        # Run complete analysis
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.run_analysis('linear', log=False, check_statics=False)
        self.translator.analyze_shear_walls(log=False, check_statics=False)
        
        # Test results extraction
        for wall_id, wall in self.translator.shear_walls.items():
            wall_combos = list(wall.model.load_combos.keys()) if wall.model.load_combos else ['Combo 1']
            
            for combo in wall_combos:
                try:
                    # Test PyNite results model creation
                    results = create_shear_wall_results_from_pynite(wall, combo)
                    
                    # Validate results structure
                    self.assertEqual(results.wall_length, wall.L, "Wall length should match")
                    self.assertEqual(results.wall_height, wall.H, "Wall height should match")
                    self.assertIsInstance(results.pier_results, dict, "Pier results should be a dict")
                    self.assertIsInstance(results.coupling_beam_results, dict, "Coupling beam results should be a dict")
                    self.assertIsInstance(results.story_stiffness, dict, "Story stiffness should be a dict")
                    
                    # Test translator results extraction
                    wall_results = self.translator.get_shear_wall_results(wall_id, combo)
                    self.assertIsInstance(wall_results, dict, "Wall results should be a dict")
                    self.assertIn('piers', wall_results, "Results should contain piers")
                    self.assertIn('coupling_beams', wall_results, "Results should contain coupling beams")
                    self.assertIn('story_stiffness', wall_results, "Results should contain story stiffness")
                    
                except Exception as e:
                    self.fail(f"Failed to extract results for wall {wall_id}, combo {combo}: {e}")
        
        print("✓ Results extraction test passed")
        
    def test_force_calculations(self):
        """Test pier and coupling beam force calculations."""
        print("\n=== Testing Force Calculations ===")
        
        # Run complete analysis
        pynite_model = self.translator.translate_model(self.aidea_model)
        self.translator.run_analysis('linear', log=False, check_statics=False)
        self.translator.analyze_shear_walls(log=False, check_statics=False)
        
        # Test force calculations
        for wall_id, wall in self.translator.shear_walls.items():
            wall_combos = list(wall.model.load_combos.keys()) if wall.model.load_combos else ['Combo 1']
            
            for combo in wall_combos:
                # Test pier forces
                for pier_id, pier in wall.piers.items():
                    try:
                        P, M, V, M_VL = pier.sum_forces(combo)
                        
                        # Forces should be finite numbers
                        self.assertTrue(abs(P) < 1e6, f"Pier {pier_id} axial force should be reasonable")
                        self.assertTrue(abs(M) < 1e6, f"Pier {pier_id} moment should be reasonable")
                        self.assertTrue(abs(V) < 1e6, f"Pier {pier_id} shear should be reasonable")
                        
                        # M/VL ratio should be reasonable (if V is not zero)
                        if abs(V) > 1e-6:
                            self.assertTrue(abs(M_VL) < 100, f"Pier {pier_id} M/VL ratio should be reasonable")
                        
                    except Exception as e:
                        self.fail(f"Failed to calculate forces for pier {pier_id}: {e}")
                
                # Test coupling beam forces
                for beam_id, beam in wall.coupling_beams.items():
                    try:
                        P, M, V, M_VH = beam.sum_forces(combo)
                        
                        # Forces should be finite numbers
                        self.assertTrue(abs(P) < 1e6, f"Beam {beam_id} axial force should be reasonable")
                        self.assertTrue(abs(M) < 1e6, f"Beam {beam_id} moment should be reasonable")
                        self.assertTrue(abs(V) < 1e6, f"Beam {beam_id} shear should be reasonable")
                        
                    except Exception as e:
                        self.fail(f"Failed to calculate forces for beam {beam_id}: {e}")
        
        print("✓ Force calculations test passed")


def run_comprehensive_tests():
    """Run all tests and provide a comprehensive report."""
    print("=" * 80)
    print("COMPREHENSIVE SHEAR WALL IMPLEMENTATION TEST SUITE")
    print("=" * 80)
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestShearWallImplementation)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n🎉 ALL TESTS PASSED! Shear wall implementation is working correctly!")
        return True
    else:
        print("\n❌ Some tests failed. Please review the issues above.")
        return False


if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)